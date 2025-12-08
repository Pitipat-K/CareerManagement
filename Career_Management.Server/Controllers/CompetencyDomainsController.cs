using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class CompetencyDomainsController : BaseAuthController
    {
        private readonly CareerManagementContext _context;

        public CompetencyDomainsController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/CompetencyDomains
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompetencyDomainDto>>> GetCompetencyDomains()
        {
            var domains = await _context.CompetencyDomains
                .Where(d => d.IsActive)
                .Include(d => d.ModifiedByEmployee)
                .OrderBy(d => d.DisplayOrder)
                .ThenBy(d => d.DomainName)
                .Select(d => new CompetencyDomainDto
                {
                    DomainID = d.DomainID,
                    DomainName = d.DomainName,
                    DomainDescription = d.DomainDescription,
                    DisplayOrder = d.DisplayOrder,
                    IsActive = d.IsActive,
                    CreatedDate = d.CreatedDate,
                    ModifiedDate = d.ModifiedDate,
                    ModifiedBy = d.ModifiedBy,
                    ModifiedByEmployeeName = d.ModifiedByEmployee != null ? $"{d.ModifiedByEmployee.FirstName} {d.ModifiedByEmployee.LastName}" : null
                })
                .ToListAsync();

            return Ok(domains);
        }

        // GET: api/CompetencyDomains/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompetencyDomainDto>> GetCompetencyDomain(int id)
        {
            var domain = await _context.CompetencyDomains
                .Where(d => d.DomainID == id && d.IsActive)
                .Include(d => d.ModifiedByEmployee)
                .Select(d => new CompetencyDomainDto
                {
                    DomainID = d.DomainID,
                    DomainName = d.DomainName,
                    DomainDescription = d.DomainDescription,
                    DisplayOrder = d.DisplayOrder,
                    IsActive = d.IsActive,
                    CreatedDate = d.CreatedDate,
                    ModifiedDate = d.ModifiedDate,
                    ModifiedBy = d.ModifiedBy,
                    ModifiedByEmployeeName = d.ModifiedByEmployee != null ? $"{d.ModifiedByEmployee.FirstName} {d.ModifiedByEmployee.LastName}" : null
                })
                .FirstOrDefaultAsync();

            if (domain == null)
            {
                return NotFound();
            }

            return Ok(domain);
        }

        // POST: api/CompetencyDomains
        [HttpPost]
        public async Task<ActionResult<CompetencyDomainDto>> CreateCompetencyDomain(CompetencyDomain domain)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            domain.IsActive = true;
            domain.CreatedDate = DateTime.Now;
            domain.ModifiedDate = DateTime.Now;
            _context.CompetencyDomains.Add(domain);
            await _context.SaveChangesAsync();

            var domainDto = new CompetencyDomainDto
            {
                DomainID = domain.DomainID,
                DomainName = domain.DomainName,
                DomainDescription = domain.DomainDescription,
                DisplayOrder = domain.DisplayOrder,
                IsActive = domain.IsActive,
                CreatedDate = domain.CreatedDate,
                ModifiedDate = domain.ModifiedDate,
                ModifiedBy = domain.ModifiedBy,
                ModifiedByEmployeeName = null // Will be populated when retrieved
            };

            return CreatedAtAction(nameof(GetCompetencyDomain), new { id = domain.DomainID }, domainDto);
        }

        // PUT: api/CompetencyDomains/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompetencyDomain(int id, CompetencyDomain domain)
        {
            if (id != domain.DomainID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingDomain = await _context.CompetencyDomains.FindAsync(id);
            if (existingDomain == null)
            {
                return NotFound();
            }

            existingDomain.DomainName = domain.DomainName;
            existingDomain.DomainDescription = domain.DomainDescription;
            existingDomain.DisplayOrder = domain.DisplayOrder;
            existingDomain.IsActive = domain.IsActive;
            existingDomain.ModifiedDate = DateTime.Now;
            existingDomain.ModifiedBy = domain.ModifiedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompetencyDomainExists(id))
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

        // DELETE: api/CompetencyDomains/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompetencyDomain(int id, [FromQuery] int? modifiedBy)
        {
            var domain = await _context.CompetencyDomains.FindAsync(id);
            if (domain == null)
            {
                return NotFound();
            }

            // Check if domain has categories
            var hasCategories = await _context.CompetencyCategories
                .AnyAsync(c => c.DomainID == id && c.IsActive);

            if (hasCategories)
            {
                return BadRequest("Cannot delete domain that has active categories.");
            }

            domain.IsActive = false;
            domain.ModifiedDate = DateTime.Now;
            domain.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CompetencyDomainExists(int id)
        {
            return _context.CompetencyDomains.Any(e => e.DomainID == id);
        }
    }
} 