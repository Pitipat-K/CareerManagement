using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class CompetenciesController : BaseAuthController
    {
        private readonly CareerManagementContext _context;

        public CompetenciesController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/Competencies
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompetencyDto>>> GetCompetencies()
        {
            var competencies = await _context.Competencies
                .Include(c => c.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(c => c.ModifiedByEmployee)
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.CompetencyName)
                .Select(c => new CompetencyDto
                {
                    CompetencyID = c.CompetencyID,
                    CategoryID = c.CategoryID,
                    CompetencyName = c.CompetencyName,
                    CompetencyDescription = c.CompetencyDescription,
                    DisplayOrder = c.DisplayOrder,
                    IsActive = c.IsActive,
                    CategoryName = c.Category!.CategoryName,
                    DomainName = c.Category.Domain!.DomainName,
                    CreatedDate = c.CreatedDate,
                    ModifiedDate = c.ModifiedDate,
                    ModifiedBy = c.ModifiedBy,
                    ModifiedByEmployeeName = c.ModifiedByEmployee != null ? $"{c.ModifiedByEmployee.FirstName} {c.ModifiedByEmployee.LastName}" : null
                })
                .ToListAsync();

            return Ok(competencies);
        }

        // GET: api/Competencies/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompetencyDto>> GetCompetency(int id)
        {
            var competency = await _context.Competencies
                .Include(c => c.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(c => c.ModifiedByEmployee)
                .Where(c => c.CompetencyID == id && c.IsActive)
                .Select(c => new CompetencyDto
                {
                    CompetencyID = c.CompetencyID,
                    CategoryID = c.CategoryID,
                    CompetencyName = c.CompetencyName,
                    CompetencyDescription = c.CompetencyDescription,
                    DisplayOrder = c.DisplayOrder,
                    IsActive = c.IsActive,
                    CategoryName = c.Category!.CategoryName,
                    DomainName = c.Category.Domain!.DomainName,
                    CreatedDate = c.CreatedDate,
                    ModifiedDate = c.ModifiedDate,
                    ModifiedBy = c.ModifiedBy,
                    ModifiedByEmployeeName = c.ModifiedByEmployee != null ? $"{c.ModifiedByEmployee.FirstName} {c.ModifiedByEmployee.LastName}" : null
                })
                .FirstOrDefaultAsync();

            if (competency == null)
            {
                return NotFound();
            }

            return Ok(competency);
        }

        // POST: api/Competencies
        [HttpPost]
        public async Task<ActionResult<CompetencyDto>> CreateCompetency(Competency competency)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            competency.IsActive = true;
            competency.CreatedDate = DateTime.Now;
            competency.ModifiedDate = DateTime.Now;
            _context.Competencies.Add(competency);
            await _context.SaveChangesAsync();

            var competencyDto = new CompetencyDto
            {
                CompetencyID = competency.CompetencyID,
                CategoryID = competency.CategoryID,
                CompetencyName = competency.CompetencyName,
                CompetencyDescription = competency.CompetencyDescription,
                DisplayOrder = competency.DisplayOrder,
                IsActive = competency.IsActive,
                CreatedDate = competency.CreatedDate,
                ModifiedDate = competency.ModifiedDate,
                ModifiedBy = competency.ModifiedBy,
                ModifiedByEmployeeName = null // Will be populated when retrieved
            };

            return CreatedAtAction(nameof(GetCompetency), new { id = competency.CompetencyID }, competencyDto);
        }

        // PUT: api/Competencies/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompetency(int id, Competency competency)
        {
            if (id != competency.CompetencyID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingCompetency = await _context.Competencies.FindAsync(id);
            if (existingCompetency == null)
            {
                return NotFound();
            }

            existingCompetency.CategoryID = competency.CategoryID;
            existingCompetency.CompetencyName = competency.CompetencyName;
            existingCompetency.CompetencyDescription = competency.CompetencyDescription;
            existingCompetency.DisplayOrder = competency.DisplayOrder;
            existingCompetency.IsActive = competency.IsActive;
            existingCompetency.ModifiedDate = DateTime.Now;
            existingCompetency.ModifiedBy = competency.ModifiedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompetencyExists(id))
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

        // DELETE: api/Competencies/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompetency(int id, [FromQuery] int? modifiedBy)
        {
            var competency = await _context.Competencies.FindAsync(id);
            if (competency == null)
            {
                return NotFound();
            }

            competency.IsActive = false;
            competency.ModifiedDate = DateTime.Now;
            competency.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CompetencyExists(int id)
        {
            return _context.Competencies.Any(e => e.CompetencyID == id);
        }
    }
} 