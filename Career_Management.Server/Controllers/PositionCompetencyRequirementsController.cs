using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PositionCompetencyRequirementsController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public PositionCompetencyRequirementsController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/PositionCompetencyRequirements
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PositionCompetencyRequirementDto>>> GetPositionCompetencyRequirements()
        {
            var requirements = await _context.PositionCompetencyRequirements
                .Include(r => r.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(r => r.ModifiedByEmployee)
                .Where(r => r.IsActive)
                .Select(r => new PositionCompetencyRequirementDto
                {
                    RequirementID = r.RequirementID,
                    PositionID = r.PositionID,
                    CompetencyID = r.CompetencyID,
                    RequiredLevel = r.RequiredLevel,
                    IsMandatory = r.IsMandatory,
                    CreatedDate = r.CreatedDate ?? DateTime.Now,
                    ModifiedDate = r.ModifiedDate ?? DateTime.Now,
                    ModifiedBy = r.ModifiedBy,
                    IsActive = r.IsActive,
                    CompetencyName = r.Competency!.CompetencyName,
                    CategoryName = r.Competency.Category!.CategoryName,
                    DomainName = r.Competency.Category.Domain!.DomainName,
                    ModifiedByEmployeeName = r.ModifiedByEmployee != null ? $"{r.ModifiedByEmployee.FirstName} {r.ModifiedByEmployee.LastName}".Trim() : null
                })
                .OrderBy(r => r.PositionID)
                .ThenBy(r => r.CompetencyName)
                .ToListAsync();

            return Ok(requirements);
        }

        // GET: api/PositionCompetencyRequirements/positions
        [HttpGet("positions")]
        public async Task<ActionResult<IEnumerable<PositionWithCompetencyCountDto>>> GetPositionsWithCompetencyCount()
        {
            var positions = await _context.Positions
                .Include(p => p.DepartmentNavigation)
                .Where(p => p.IsActive)
                .Select(p => new PositionWithCompetencyCountDto
                {
                    PositionID = p.PositionID,
                    PositionTitle = p.PositionTitle,
                    PositionDescription = p.PositionDescription,
                    DepartmentName = p.DepartmentNavigation!.DepartmentName,
                    IsActive = p.IsActive,
                    AssignedCompetenciesCount = _context.PositionCompetencyRequirements
                        .Count(r => r.PositionID == p.PositionID && r.IsActive)
                })
                .OrderBy(p => p.PositionTitle)
                .ToListAsync();

            return Ok(positions);
        }

        // GET: api/PositionCompetencyRequirements/position/{positionId}
        [HttpGet("position/{positionId}")]
        public async Task<ActionResult<IEnumerable<PositionCompetencyRequirementDto>>> GetRequirementsByPosition(int positionId)
        {
            var requirements = await _context.PositionCompetencyRequirements
                .Include(r => r.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(r => r.ModifiedByEmployee)
                .Where(r => r.PositionID == positionId && r.IsActive)
                .Select(r => new PositionCompetencyRequirementDto
                {
                    RequirementID = r.RequirementID,
                    PositionID = r.PositionID,
                    CompetencyID = r.CompetencyID,
                    RequiredLevel = r.RequiredLevel,
                    IsMandatory = r.IsMandatory,
                    CreatedDate = r.CreatedDate ?? DateTime.Now,
                    ModifiedDate = r.ModifiedDate ?? DateTime.Now,
                    ModifiedBy = r.ModifiedBy,
                    IsActive = r.IsActive,
                    CompetencyName = r.Competency!.CompetencyName,
                    CategoryName = r.Competency.Category!.CategoryName,
                    DomainName = r.Competency.Category.Domain!.DomainName,
                    ModifiedByEmployeeName = r.ModifiedByEmployee != null ? $"{r.ModifiedByEmployee.FirstName} {r.ModifiedByEmployee.LastName}".Trim() : null
                })
                .OrderBy(r => r.CompetencyName)
                .ToListAsync();

            return Ok(requirements);
        }

        // POST: api/PositionCompetencyRequirements
        [HttpPost]
        public async Task<ActionResult<PositionCompetencyRequirementDto>> CreateRequirement(PositionCompetencyRequirement requirement)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if requirement already exists
            var existingRequirement = await _context.PositionCompetencyRequirements
                .FirstOrDefaultAsync(r => r.PositionID == requirement.PositionID && 
                                        r.CompetencyID == requirement.CompetencyID && 
                                        r.IsActive);

            if (existingRequirement != null)
            {
                return BadRequest("This competency is already assigned to this position.");
            }

            requirement.IsActive = true;
            requirement.CreatedDate = DateTime.Now;
            requirement.ModifiedDate = DateTime.Now;
            // ModifiedBy is set from the frontend

            _context.PositionCompetencyRequirements.Add(requirement);
            await _context.SaveChangesAsync();

            var requirementDto = new PositionCompetencyRequirementDto
            {
                RequirementID = requirement.RequirementID,
                PositionID = requirement.PositionID,
                CompetencyID = requirement.CompetencyID,
                RequiredLevel = requirement.RequiredLevel,
                IsMandatory = requirement.IsMandatory,
                CreatedDate = requirement.CreatedDate,
                ModifiedDate = requirement.ModifiedDate,
                ModifiedBy = requirement.ModifiedBy,
                IsActive = requirement.IsActive
            };

            return CreatedAtAction(nameof(GetRequirementsByPosition), new { positionId = requirement.PositionID }, requirementDto);
        }

        // PUT: api/PositionCompetencyRequirements/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRequirement(int id, PositionCompetencyRequirement requirement)
        {
            if (id != requirement.RequirementID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingRequirement = await _context.PositionCompetencyRequirements.FindAsync(id);
            if (existingRequirement == null)
            {
                return NotFound();
            }

            existingRequirement.RequiredLevel = requirement.RequiredLevel;
            existingRequirement.IsMandatory = requirement.IsMandatory;
            existingRequirement.ModifiedDate = DateTime.Now;
            existingRequirement.ModifiedBy = requirement.ModifiedBy; // Set from frontend
            existingRequirement.IsActive = requirement.IsActive;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RequirementExists(id))
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

        // DELETE: api/PositionCompetencyRequirements/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequirement(int id, [FromQuery] int? modifiedBy)
        {
            var requirement = await _context.PositionCompetencyRequirements.FindAsync(id);
            if (requirement == null)
            {
                return NotFound();
            }

            requirement.IsActive = false;
            requirement.ModifiedDate = DateTime.Now;
            requirement.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool RequirementExists(int id)
        {
            return _context.PositionCompetencyRequirements.Any(e => e.RequirementID == id);
        }
    }
} 