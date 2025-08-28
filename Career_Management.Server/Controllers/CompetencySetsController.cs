using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompetencySetsController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public CompetencySetsController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/CompetencySets
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompetencySetDto>>> GetCompetencySets([FromQuery] bool? isPublic = null)
        {
            var query = _context.CompetencySets
                .Include(cs => cs.CreatedByEmployee)
                .Include(cs => cs.CompetencySetItems)
                .Where(cs => cs.IsActive);

            if (isPublic.HasValue)
            {
                query = query.Where(cs => cs.IsPublic == isPublic.Value);
            }

            var competencySets = await query
                .Select(cs => new CompetencySetDto
                {
                    SetID = cs.SetID,
                    SetName = cs.SetName,
                    Description = cs.Description,
                    IsPublic = cs.IsPublic,
                    CreatedBy = cs.CreatedBy,
                    CreatedByEmployeeName = cs.CreatedByEmployee != null ? 
                        $"{cs.CreatedByEmployee.FirstName} {cs.CreatedByEmployee.LastName}".Trim() : null,
                    CreatedDate = cs.CreatedDate,
                    ModifiedDate = cs.ModifiedDate,
                    IsActive = cs.IsActive,
                    CompetencyCount = cs.CompetencySetItems.Count
                })
                .OrderBy(cs => cs.SetName)
                .ToListAsync();

            return Ok(competencySets);
        }

        // GET: api/CompetencySets/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CompetencySetWithItemsDto>> GetCompetencySet(int id)
        {
            var competencySet = await _context.CompetencySets
                .Include(cs => cs.CreatedByEmployee)
                .Include(cs => cs.CompetencySetItems)
                .ThenInclude(csi => csi.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .FirstOrDefaultAsync(cs => cs.SetID == id && cs.IsActive);

            if (competencySet == null)
            {
                return NotFound();
            }

            var dto = new CompetencySetWithItemsDto
            {
                SetID = competencySet.SetID,
                SetName = competencySet.SetName,
                Description = competencySet.Description,
                IsPublic = competencySet.IsPublic,
                CreatedBy = competencySet.CreatedBy,
                CreatedByEmployeeName = competencySet.CreatedByEmployee != null ? 
                    $"{competencySet.CreatedByEmployee.FirstName} {competencySet.CreatedByEmployee.LastName}".Trim() : null,
                CreatedDate = competencySet.CreatedDate,
                ModifiedDate = competencySet.ModifiedDate,
                IsActive = competencySet.IsActive,
                CompetencySetItems = competencySet.CompetencySetItems
                    .OrderBy(csi => csi.DisplayOrder)
                    .Select(csi => new CompetencySetItemDto
                    {
                        ItemID = csi.ItemID,
                        SetID = csi.SetID,
                        CompetencyID = csi.CompetencyID,
                        CompetencyName = csi.Competency?.CompetencyName ?? "",
                        CategoryName = csi.Competency?.Category?.CategoryName,
                        DomainName = csi.Competency?.Category?.Domain?.DomainName,
                        RequiredLevel = csi.RequiredLevel,
                        IsMandatory = csi.IsMandatory,
                        DisplayOrder = csi.DisplayOrder,
                        CreatedDate = csi.CreatedDate
                    })
                    .ToList()
            };

            return Ok(dto);
        }

        // GET: api/CompetencySets/{id}/items
        [HttpGet("{id}/items")]
        public async Task<ActionResult<IEnumerable<CompetencySetItemDto>>> GetCompetencySetItems(int id)
        {
            var competencySet = await _context.CompetencySets
                .Include(cs => cs.CompetencySetItems)
                .ThenInclude(csi => csi.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .FirstOrDefaultAsync(cs => cs.SetID == id && cs.IsActive);

            if (competencySet == null)
            {
                return NotFound();
            }

            var items = competencySet.CompetencySetItems
                .OrderBy(csi => csi.DisplayOrder)
                .Select(csi => new CompetencySetItemDto
                {
                    ItemID = csi.ItemID,
                    SetID = csi.SetID,
                    CompetencyID = csi.CompetencyID,
                    CompetencyName = csi.Competency?.CompetencyName ?? "",
                    CategoryName = csi.Competency?.Category?.CategoryName,
                    DomainName = csi.Competency?.Category?.Domain?.DomainName,
                    RequiredLevel = csi.RequiredLevel,
                    IsMandatory = csi.IsMandatory,
                    DisplayOrder = csi.DisplayOrder,
                    CreatedDate = csi.CreatedDate
                })
                .ToList();

            return Ok(items);
        }

        // PUT: api/CompetencySets/{id}/items/{itemId}
        [HttpPut("{id}/items/{itemId}")]
        public async Task<IActionResult> UpdateCompetencySetItem(int id, int itemId, [FromBody] UpdateCompetencySetItemRequest request)
        {
            var item = await _context.CompetencySetItems
                .FirstOrDefaultAsync(csi => csi.ItemID == itemId && csi.SetID == id);

            if (item == null)
            {
                return NotFound();
            }

            item.RequiredLevel = request.RequiredLevel;
            item.IsMandatory = request.IsMandatory;
            item.DisplayOrder = request.DisplayOrder;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/CompetencySets
        [HttpPost]
        public async Task<ActionResult<CompetencySetDto>> CreateCompetencySet(CompetencySet competencySet)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            competencySet.IsActive = true;
            competencySet.CreatedDate = DateTime.Now;
            competencySet.ModifiedDate = DateTime.Now;

            _context.CompetencySets.Add(competencySet);
            await _context.SaveChangesAsync();

            var dto = new CompetencySetDto
            {
                SetID = competencySet.SetID,
                SetName = competencySet.SetName,
                Description = competencySet.Description,
                IsPublic = competencySet.IsPublic,
                CreatedBy = competencySet.CreatedBy,
                CreatedDate = competencySet.CreatedDate,
                ModifiedDate = competencySet.ModifiedDate,
                IsActive = competencySet.IsActive,
                CompetencyCount = 0
            };

            return CreatedAtAction(nameof(GetCompetencySet), new { id = competencySet.SetID }, dto);
        }

        // PUT: api/CompetencySets/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompetencySet(int id, [FromBody] UpdateCompetencySetRequest request)
        {
            var existingSet = await _context.CompetencySets.FindAsync(id);
            if (existingSet == null)
            {
                return NotFound();
            }

            existingSet.SetName = request.SetName;
            existingSet.Description = request.Description;
            existingSet.IsPublic = request.IsPublic;
            existingSet.ModifiedDate = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompetencySetExists(id))
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

        // DELETE: api/CompetencySets/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompetencySet(int id)
        {
            var competencySet = await _context.CompetencySets.FindAsync(id);
            if (competencySet == null)
            {
                return NotFound();
            }

            competencySet.IsActive = false;
            competencySet.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/CompetencySets/{id}/items
        [HttpPost("{id}/items")]
        public async Task<ActionResult<CompetencySetItemDto>> AddCompetencyToSet(int id, CompetencySetItem item)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var competencySet = await _context.CompetencySets.FindAsync(id);
            if (competencySet == null)
            {
                return NotFound();
            }

            item.SetID = id;
            item.CreatedDate = DateTime.Now;

            _context.CompetencySetItems.Add(item);
            await _context.SaveChangesAsync();

            var competency = await _context.Competencies
                .Include(c => c.Category)
                .ThenInclude(cat => cat!.Domain)
                .FirstOrDefaultAsync(c => c.CompetencyID == item.CompetencyID);

            var dto = new CompetencySetItemDto
            {
                ItemID = item.ItemID,
                SetID = item.SetID,
                CompetencyID = item.CompetencyID,
                CompetencyName = competency?.CompetencyName ?? "",
                CategoryName = competency?.Category?.CategoryName,
                DomainName = competency?.Category?.Domain?.DomainName,
                RequiredLevel = item.RequiredLevel,
                IsMandatory = item.IsMandatory,
                DisplayOrder = item.DisplayOrder,
                CreatedDate = item.CreatedDate
            };

            return CreatedAtAction(nameof(GetCompetencySet), new { id = item.SetID }, dto);
        }

        // DELETE: api/CompetencySets/{id}/items/{itemId}
        [HttpDelete("{id}/items/{itemId}")]
        public async Task<IActionResult> RemoveCompetencyFromSet(int id, int itemId)
        {
            var item = await _context.CompetencySetItems
                .FirstOrDefaultAsync(csi => csi.ItemID == itemId && csi.SetID == id);

            if (item == null)
            {
                return NotFound();
            }

            _context.CompetencySetItems.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/CompetencySets/copy-from-position
        [HttpPost("copy-from-position")]
        public async Task<ActionResult<CompetencySetDto>> CopyFromPosition([FromBody] CopyFromPositionRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get competencies from the position
            var positionCompetencies = await _context.PositionCompetencyRequirements
                .Include(pcr => pcr.Competency)
                .Where(pcr => pcr.PositionID == request.PositionID && pcr.IsActive)
                .ToListAsync();

            if (!positionCompetencies.Any())
            {
                return BadRequest("No competencies found for the specified position.");
            }

            // Create new competency set
            var competencySet = new CompetencySet
            {
                SetName = request.SetName,
                Description = request.Description,
                IsPublic = request.IsPublic,
                CreatedBy = request.CreatedBy,
                IsActive = true,
                CreatedDate = DateTime.Now,
                ModifiedDate = DateTime.Now
            };

            _context.CompetencySets.Add(competencySet);
            await _context.SaveChangesAsync();

            // Add competencies to the set
            var competencySetItems = positionCompetencies.Select((pc, index) => new CompetencySetItem
            {
                SetID = competencySet.SetID,
                CompetencyID = pc.CompetencyID,
                RequiredLevel = pc.RequiredLevel,
                IsMandatory = pc.IsMandatory,
                DisplayOrder = index,
                CreatedDate = DateTime.Now
            }).ToList();

            _context.CompetencySetItems.AddRange(competencySetItems);
            await _context.SaveChangesAsync();

            var dto = new CompetencySetDto
            {
                SetID = competencySet.SetID,
                SetName = competencySet.SetName,
                Description = competencySet.Description,
                IsPublic = competencySet.IsPublic,
                CreatedBy = competencySet.CreatedBy,
                CreatedDate = competencySet.CreatedDate,
                ModifiedDate = competencySet.ModifiedDate,
                IsActive = competencySet.IsActive,
                CompetencyCount = competencySetItems.Count
            };

            return CreatedAtAction(nameof(GetCompetencySet), new { id = competencySet.SetID }, dto);
        }

        // POST: api/CompetencySets/{id}/apply-to-position
        [HttpPost("{id}/apply-to-position")]
        public async Task<IActionResult> ApplyToPosition(int id, [FromBody] ApplyToPositionRequest request)
        {
            var competencySet = await _context.CompetencySets
                .Include(cs => cs.CompetencySetItems)
                .FirstOrDefaultAsync(cs => cs.SetID == id && cs.IsActive);

            if (competencySet == null)
            {
                return NotFound();
            }

            // Check if position exists
            var position = await _context.Positions.FindAsync(request.PositionID);
            if (position == null)
            {
                return BadRequest("Position not found.");
            }

            // Get current employee ID for tracking
            var currentEmployeeId = request.ModifiedBy;

            // Remove existing competency requirements for this position
            var existingRequirements = await _context.PositionCompetencyRequirements
                .Where(pcr => pcr.PositionID == request.PositionID && pcr.IsActive)
                .ToListAsync();

            foreach (var requirement in existingRequirements)
            {
                requirement.IsActive = false;
                requirement.ModifiedDate = DateTime.Now;
                requirement.ModifiedBy = currentEmployeeId;
            }

            // Add new competency requirements from the set
            var newRequirements = competencySet.CompetencySetItems.Select(csi => new PositionCompetencyRequirement
            {
                PositionID = request.PositionID,
                CompetencyID = csi.CompetencyID,
                RequiredLevel = csi.RequiredLevel,
                IsMandatory = csi.IsMandatory,
                CreatedDate = DateTime.Now,
                ModifiedDate = DateTime.Now,
                ModifiedBy = currentEmployeeId,
                IsActive = true
            }).ToList();

            _context.PositionCompetencyRequirements.AddRange(newRequirements);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CompetencySetExists(int id)
        {
            return _context.CompetencySets.Any(e => e.SetID == id);
        }
    }

    public class CopyFromPositionRequest
    {
        public string SetName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
        public int PositionID { get; set; }
        public int CreatedBy { get; set; }
    }

    public class ApplyToPositionRequest
    {
        public int PositionID { get; set; }
        public int ModifiedBy { get; set; }
    }
}
