using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompaniesController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public CompaniesController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/Companies
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompanyDto>>> GetCompanies()
        {
            var companies = await _context.Companies
                .Where(c => c.IsActive)
                .Include(c => c.Departments)
                .Include(c => c.ModifiedByEmployee)
                .ToListAsync();

            var companyDtos = companies.Select(c => new CompanyDto
            {
                CompanyID = c.CompanyID,
                CompanyName = c.CompanyName,
                Description = c.Description,
                DirectorID = c.DirectorID,
                IsActive = c.IsActive,
                CreatedDate = c.CreatedDate,
                ModifiedDate = c.ModifiedDate,
                ModifiedBy = c.ModifiedBy,
                ModifiedByEmployeeName = c.ModifiedByEmployee != null ? $"{c.ModifiedByEmployee.FirstName} {c.ModifiedByEmployee.LastName}" : null,
                DepartmentCount = c.Departments.Count,
                DirectorName = c.DirectorID.HasValue ? 
                    _context.Employees
                        .Where(e => e.EmployeeID == c.DirectorID && e.IsActive)
                        .Select(e => e.FullName)
                        .FirstOrDefault() : null
            }).ToList();

            return companyDtos;
        }

        // GET: api/Companies/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompanyDto>> GetCompany(int id)
        {
            var company = await _context.Companies
                .Include(c => c.Departments)
                .Include(c => c.ModifiedByEmployee)
                .FirstOrDefaultAsync(c => c.CompanyID == id && c.IsActive);

            if (company == null)
            {
                return NotFound();
            }

            var companyDto = new CompanyDto
            {
                CompanyID = company.CompanyID,
                CompanyName = company.CompanyName,
                Description = company.Description,
                DirectorID = company.DirectorID,
                IsActive = company.IsActive,
                CreatedDate = company.CreatedDate,
                ModifiedDate = company.ModifiedDate,
                ModifiedBy = company.ModifiedBy,
                ModifiedByEmployeeName = company.ModifiedByEmployee != null ? $"{company.ModifiedByEmployee.FirstName} {company.ModifiedByEmployee.LastName}" : null,
                DepartmentCount = company.Departments.Count,
                DirectorName = company.DirectorID.HasValue ? 
                    _context.Employees
                        .Where(e => e.EmployeeID == company.DirectorID && e.IsActive)
                        .Select(e => e.FullName)
                        .FirstOrDefault() : null
            };

            return companyDto;
        }

        // POST: api/Companies
        [HttpPost]
        public async Task<ActionResult<Company>> CreateCompany(Company company)
        {
            company.CreatedDate = DateTime.Now;
            company.ModifiedDate = DateTime.Now;
            company.IsActive = true;
            
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCompany), new { id = company.CompanyID }, company);
        }

        // PUT: api/Companies/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompany(int id, Company company)
        {
            if (id != company.CompanyID)
            {
                return BadRequest();
            }

            var existingCompany = await _context.Companies.FindAsync(id);
            if (existingCompany == null)
            {
                return NotFound();
            }

            existingCompany.CompanyName = company.CompanyName;
            existingCompany.Description = company.Description;
            existingCompany.DirectorID = company.DirectorID;
            existingCompany.IsActive = company.IsActive;
            existingCompany.ModifiedDate = DateTime.Now;
            existingCompany.ModifiedBy = company.ModifiedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompanyExists(id))
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

        // DELETE: api/Companies/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompany(int id, [FromQuery] int? modifiedBy)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
            {
                return NotFound();
            }

            company.IsActive = false;
            company.ModifiedDate = DateTime.Now;
            company.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CompanyExists(int id)
        {
            return _context.Companies.Any(e => e.CompanyID == id && e.IsActive);
        }
    }
} 