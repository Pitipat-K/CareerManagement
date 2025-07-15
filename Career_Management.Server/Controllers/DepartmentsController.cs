using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentsController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public DepartmentsController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/Departments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetDepartments()
        {
            var departments = await _context.Departments
                .Where(d => d.IsActive)
                .Include(d => d.Company)
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
            department.CreatedDate = DateTime.Now;
            department.IsActive = true;
            
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDepartment), new { id = department.DepartmentID }, department);
        }

        // PUT: api/Departments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, Department department)
        {
            if (id != department.DepartmentID)
            {
                return BadRequest();
            }

            var existingDepartment = await _context.Departments.FindAsync(id);
            if (existingDepartment == null || !existingDepartment.IsActive)
            {
                return NotFound();
            }

            existingDepartment.DepartmentName = department.DepartmentName;
            existingDepartment.Description = department.Description;
            existingDepartment.CompanyID = department.CompanyID;
            existingDepartment.ManagerID = department.ManagerID;

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
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null || !department.IsActive)
            {
                return NotFound();
            }

            department.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DepartmentExists(int id)
        {
            return _context.Departments.Any(e => e.DepartmentID == id && e.IsActive);
        }
    }
} 