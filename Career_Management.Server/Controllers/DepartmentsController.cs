using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;
using Career_Management.Server.Services;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class DepartmentsController : BaseAuthController
    {
        private readonly CareerManagementContext _context;
        private readonly IPermissionService _permissionService;

        public DepartmentsController(CareerManagementContext context, IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // Helper method to check permission
        private async Task<bool> CheckPermissionAsync(string permissionCode)
        {
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue) return false;
            
            return await _permissionService.HasPermissionAsync(currentUserId.Value, "DEPARTMENTS", permissionCode);
        }

        // GET: api/Departments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetDepartments()
        {
            // Check permission
            if (!await CheckPermissionAsync("R"))
            {
                return StatusCode(403, "Insufficient permissions to view departments");
            }

            var departments = await _context.Departments
                .Where(d => d.IsActive)
                .Include(d => d.Company)
                .Include(d => d.ModifiedByEmployee)
                .ToListAsync();

            var departmentDtos = departments.Select(d => new DepartmentDto
            {
                DepartmentID = d.DepartmentID,
                CompanyID = d.CompanyID,
                DepartmentName = d.DepartmentName,
                Description = d.Description,
                ManagerID = d.ManagerID,
                IsActive = d.IsActive,
                CreatedDate = d.CreatedDate,
                ModifiedDate = d.ModifiedDate,
                ModifiedBy = d.ModifiedBy,
                ModifiedByEmployeeName = d.ModifiedByEmployee != null ? $"{d.ModifiedByEmployee.FirstName} {d.ModifiedByEmployee.LastName}" : null,
                CompanyName = d.Company != null ? d.Company.CompanyName : null,
                ManagerName = d.ManagerID.HasValue ? 
                    _context.Employees
                        .Where(e => e.EmployeeID == d.ManagerID && e.IsActive)
                        .Select(e => e.FullName)
                        .FirstOrDefault() : null
            }).ToList();

            return departmentDtos;
        }

        // GET: api/Departments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DepartmentDto>> GetDepartment(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Company)
                .Include(d => d.ModifiedByEmployee)
                .FirstOrDefaultAsync(d => d.DepartmentID == id && d.IsActive);

            if (department == null)
            {
                return NotFound();
            }

            var departmentDto = new DepartmentDto
            {
                DepartmentID = department.DepartmentID,
                CompanyID = department.CompanyID,
                DepartmentName = department.DepartmentName,
                Description = department.Description,
                ManagerID = department.ManagerID,
                IsActive = department.IsActive,
                CreatedDate = department.CreatedDate,
                ModifiedDate = department.ModifiedDate,
                ModifiedBy = department.ModifiedBy,
                ModifiedByEmployeeName = department.ModifiedByEmployee != null ? $"{department.ModifiedByEmployee.FirstName} {department.ModifiedByEmployee.LastName}" : null,
                CompanyName = department.Company != null ? department.Company.CompanyName : null,
                ManagerName = department.ManagerID.HasValue ? 
                    _context.Employees
                        .Where(e => e.EmployeeID == department.ManagerID && e.IsActive)
                        .Select(e => e.FullName)
                        .FirstOrDefault() : null
            };

            return departmentDto;
        }

        // POST: api/Departments
        [HttpPost]
        public async Task<ActionResult<Department>> CreateDepartment(Department department)
        {
            // Check permission
            if (!await CheckPermissionAsync("C"))
            {
                return StatusCode(403, "Insufficient permissions to create departments");
            }

            department.CreatedDate = DateTime.Now;
            department.ModifiedDate = DateTime.Now;
            department.IsActive = true;
            
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDepartment), new { id = department.DepartmentID }, department);
        }

        // PUT: api/Departments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, Department department)
        {
            // Check permission
            if (!await CheckPermissionAsync("U"))
            {
                return StatusCode(403, "Insufficient permissions to update departments");
            }

            if (id != department.DepartmentID)
            {
                return BadRequest();
            }

            var existingDepartment = await _context.Departments.FindAsync(id);
            if (existingDepartment == null)
            {
                return NotFound();
            }

            existingDepartment.CompanyID = department.CompanyID;
            existingDepartment.DepartmentName = department.DepartmentName;
            existingDepartment.Description = department.Description;
            existingDepartment.ManagerID = department.ManagerID;
            existingDepartment.IsActive = department.IsActive;
            existingDepartment.ModifiedDate = DateTime.Now;
            existingDepartment.ModifiedBy = department.ModifiedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DepartmentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Departments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id, [FromQuery] int? modifiedBy)
        {
            // Check permission
            if (!await CheckPermissionAsync("D"))
            {
                return StatusCode(403, "Insufficient permissions to delete departments");
            }

            var department = await _context.Departments.FindAsync(id);
            if (department == null)
            {
                return NotFound();
            }

            department.IsActive = false;
            department.ModifiedDate = DateTime.Now;
            department.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DepartmentExists(int id)
        {
            return _context.Departments.Any(e => e.DepartmentID == id && e.IsActive);
        }
    }
} 