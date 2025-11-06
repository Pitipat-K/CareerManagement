using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;
using System.Security.Cryptography;
using System.Text;

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

        #region Helper Methods

        // Calculate hash for a competency set to detect changes
        private string CalculateSetVersionHash(int setId)
        {
            var setItems = _context.CompetencySetItems
                .Where(csi => csi.SetID == setId)
                .OrderBy(csi => csi.CompetencyID)
                .Select(csi => new { csi.CompetencyID, csi.RequiredLevel, csi.IsMandatory })
                .ToList();

            var hashInput = string.Join("|", setItems.Select(i => $"{i.CompetencyID}:{i.RequiredLevel}:{i.IsMandatory}"));
            
            using (var sha256 = SHA256.Create())
            {
                var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(hashInput));
                return Convert.ToBase64String(hashBytes);
            }
        }

        // Mark all positions assigned to a set as out of sync
        private async Task MarkPositionsOutOfSync(int setId)
        {
            var newHash = CalculateSetVersionHash(setId);
            
            var assignments = await _context.PositionCompetencySets
                .Where(pcs => pcs.SetID == setId && pcs.IsActive)
                .ToListAsync();

            foreach (var assignment in assignments)
            {
                if (assignment.SetVersionHash != newHash)
                {
                    assignment.IsSynced = false;
                    assignment.ModifiedDate = DateTime.Now;
                }
            }

            await _context.SaveChangesAsync();
        }

        // Compare competencies between a set and a position
        private async Task<List<CompetencyChangeDto>> CompareSetWithPosition(int setId, int positionId)
        {
            var setItems = await _context.CompetencySetItems
                .Include(csi => csi.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .Where(csi => csi.SetID == setId)
                .ToListAsync();

            var positionRequirements = await _context.PositionCompetencyRequirements
                .Where(pcr => pcr.PositionID == positionId && pcr.IsActive)
                .ToListAsync();

            var positionReqDict = positionRequirements.ToDictionary(pr => pr.CompetencyID);
            var changes = new List<CompetencyChangeDto>();

            // Find added and modified competencies
            foreach (var setItem in setItems)
            {
                if (!positionReqDict.ContainsKey(setItem.CompetencyID))
                {
                    // Competency in set but not in position (added)
                    changes.Add(new CompetencyChangeDto
                    {
                        CompetencyID = setItem.CompetencyID,
                        CompetencyName = setItem.Competency?.CompetencyName ?? "",
                        CategoryName = setItem.Competency?.Category?.CategoryName,
                        DomainName = setItem.Competency?.Category?.Domain?.DomainName,
                        ChangeType = "added",
                        NewLevel = setItem.RequiredLevel,
                        NewIsMandatory = setItem.IsMandatory
                    });
                }
                else
                {
                    var posReq = positionReqDict[setItem.CompetencyID];
                    if (posReq.RequiredLevel != setItem.RequiredLevel || posReq.IsMandatory != setItem.IsMandatory)
                    {
                        // Competency exists but with different requirements (modified)
                        changes.Add(new CompetencyChangeDto
                        {
                            CompetencyID = setItem.CompetencyID,
                            CompetencyName = setItem.Competency?.CompetencyName ?? "",
                            CategoryName = setItem.Competency?.Category?.CategoryName,
                            DomainName = setItem.Competency?.Category?.Domain?.DomainName,
                            ChangeType = "modified",
                            OldLevel = posReq.RequiredLevel,
                            NewLevel = setItem.RequiredLevel,
                            OldIsMandatory = posReq.IsMandatory,
                            NewIsMandatory = setItem.IsMandatory
                        });
                    }
                }
            }

            // Find removed competencies (in position but not in set)
            var setCompetencyIds = setItems.Select(si => si.CompetencyID).ToHashSet();
            foreach (var posReq in positionRequirements)
            {
                if (!setCompetencyIds.Contains(posReq.CompetencyID))
                {
                    var competency = await _context.Competencies
                        .Include(c => c.Category)
                        .ThenInclude(cat => cat!.Domain)
                        .FirstOrDefaultAsync(c => c.CompetencyID == posReq.CompetencyID);

                    changes.Add(new CompetencyChangeDto
                    {
                        CompetencyID = posReq.CompetencyID,
                        CompetencyName = competency?.CompetencyName ?? "",
                        CategoryName = competency?.Category?.CategoryName,
                        DomainName = competency?.Category?.Domain?.DomainName,
                        ChangeType = "removed",
                        OldLevel = posReq.RequiredLevel,
                        OldIsMandatory = posReq.IsMandatory
                    });
                }
            }

            return changes;
        }

        #endregion

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
                    CompetencyCount = cs.CompetencySetItems.Count,
                    AssignedPositionsCount = _context.PositionCompetencySets.Count(pcs => pcs.SetID == cs.SetID && pcs.IsActive),
                    OutOfSyncPositionsCount = _context.PositionCompetencySets.Count(pcs => pcs.SetID == cs.SetID && pcs.IsActive && !pcs.IsSynced)
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
                    CompetencyDescription = csi.Competency?.CompetencyDescription ?? "",
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

            // Mark positions as out of sync
            await MarkPositionsOutOfSync(id);

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

            // Mark positions as out of sync
            await MarkPositionsOutOfSync(id);

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
                CompetencyDescription = competency?.CompetencyDescription ?? "",
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

            // Mark positions as out of sync
            await MarkPositionsOutOfSync(id);

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

            // Get existing competency requirements for this position
            var existingRequirements = await _context.PositionCompetencyRequirements
                .Where(pcr => pcr.PositionID == request.PositionID && pcr.IsActive)
                .ToListAsync();

            // Create a dictionary of existing requirements by CompetencyID for quick lookup
            var existingRequirementsDict = existingRequirements.ToDictionary(r => r.CompetencyID);

            // Process each competency in the set
            var newRequirements = new List<PositionCompetencyRequirement>();
            
            foreach (var setItem in competencySet.CompetencySetItems)
            {
                if (existingRequirementsDict.ContainsKey(setItem.CompetencyID))
                {
                    // Update existing requirement with new values from the set
                    var existingReq = existingRequirementsDict[setItem.CompetencyID];
                    existingReq.RequiredLevel = setItem.RequiredLevel;
                    existingReq.IsMandatory = setItem.IsMandatory;
                    existingReq.ModifiedDate = DateTime.Now;
                    existingReq.ModifiedBy = currentEmployeeId;
                }
                else
                {
                    // Add new requirement for competencies not already in the position
                    newRequirements.Add(new PositionCompetencyRequirement
                    {
                        PositionID = request.PositionID,
                        CompetencyID = setItem.CompetencyID,
                        RequiredLevel = setItem.RequiredLevel,
                        IsMandatory = setItem.IsMandatory,
                        CreatedDate = DateTime.Now,
                        ModifiedDate = DateTime.Now,
                        ModifiedBy = currentEmployeeId,
                        IsActive = true
                    });
                }
            }

            // Add new requirements to the database
            if (newRequirements.Any())
            {
                _context.PositionCompetencyRequirements.AddRange(newRequirements);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        #region Position Assignment Endpoints

        // GET: api/CompetencySets/{id}/positions
        [HttpGet("{id}/positions")]
        public async Task<ActionResult<IEnumerable<PositionCompetencySetDto>>> GetAssignedPositions(int id)
        {
            var assignments = await _context.PositionCompetencySets
                .Include(pcs => pcs.Position)
                .ThenInclude(p => p!.DepartmentNavigation)
                .Include(pcs => pcs.AssignedByEmployee)
                .Where(pcs => pcs.SetID == id && pcs.IsActive)
                .Select(pcs => new PositionCompetencySetDto
                {
                    AssignmentID = pcs.AssignmentID,
                    PositionID = pcs.PositionID,
                    SetID = pcs.SetID,
                    PositionTitle = pcs.Position!.PositionTitle,
                    DepartmentName = pcs.Position.DepartmentNavigation != null ? pcs.Position.DepartmentNavigation.DepartmentName : null,
                    AssignedDate = pcs.AssignedDate,
                    LastSyncedDate = pcs.LastSyncedDate,
                    IsSynced = pcs.IsSynced,
                    AssignedByName = pcs.AssignedByEmployee != null ? 
                        $"{pcs.AssignedByEmployee.FirstName} {pcs.AssignedByEmployee.LastName}".Trim() : "",
                    CompetencyCount = _context.PositionCompetencyRequirements
                        .Count(pcr => pcr.PositionID == pcs.PositionID && pcr.IsActive)
                })
                .OrderBy(dto => dto.PositionTitle)
                .ToListAsync();

            return Ok(assignments);
        }

        // GET: api/CompetencySets/{id}/available-positions
        [HttpGet("{id}/available-positions")]
        public async Task<ActionResult<IEnumerable<PositionDto>>> GetAvailablePositions(int id)
        {
            // Get positions that are not already assigned to this set
            var assignedPositionIds = await _context.PositionCompetencySets
                .Where(pcs => pcs.SetID == id && pcs.IsActive)
                .Select(pcs => pcs.PositionID)
                .ToListAsync();

            var availablePositions = await _context.Positions
                .Include(p => p.DepartmentNavigation)
                .Where(p => p.IsActive && !assignedPositionIds.Contains(p.PositionID))
                .Select(p => new PositionDto
                {
                    PositionID = p.PositionID,
                    PositionTitle = p.PositionTitle,
                    PositionDescription = p.PositionDescription,
                    DepartmentName = p.DepartmentNavigation != null ? p.DepartmentNavigation.DepartmentName : null,
                    IsActive = p.IsActive
                })
                .OrderBy(p => p.PositionTitle)
                .ToListAsync();

            return Ok(availablePositions);
        }

        // POST: api/CompetencySets/{id}/assign-position
        [HttpPost("{id}/assign-position")]
        public async Task<ActionResult<PositionCompetencySetDto>> AssignPositionToSet(int id, [FromBody] AssignPositionToSetRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if set exists
            var competencySet = await _context.CompetencySets
                .Include(cs => cs.CompetencySetItems)
                .FirstOrDefaultAsync(cs => cs.SetID == id && cs.IsActive);

            if (competencySet == null)
            {
                return NotFound("Competency set not found.");
            }

            // Check if position exists
            var position = await _context.Positions.FindAsync(request.PositionID);
            if (position == null || !position.IsActive)
            {
                return BadRequest("Position not found or inactive.");
            }

            // Check if assignment already exists
            var existingAssignment = await _context.PositionCompetencySets
                .FirstOrDefaultAsync(pcs => pcs.PositionID == request.PositionID && pcs.SetID == id);

            if (existingAssignment != null)
            {
                if (existingAssignment.IsActive)
                {
                    return BadRequest("Position is already assigned to this competency set.");
                }
                else
                {
                    // Reactivate the assignment
                    existingAssignment.IsActive = true;
                    existingAssignment.ModifiedDate = DateTime.Now;
                    existingAssignment.ModifiedBy = request.AssignedBy;
                }
            }
            else
            {
                // Create new assignment
                var newAssignment = new PositionCompetencySet
                {
                    PositionID = request.PositionID,
                    SetID = id,
                    AssignedDate = DateTime.Now,
                    AssignedBy = request.AssignedBy,
                    LastSyncedDate = DateTime.Now,
                    SetVersionHash = CalculateSetVersionHash(id),
                    IsSynced = true,
                    IsActive = true,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now
                };

                _context.PositionCompetencySets.Add(newAssignment);
            }

            // Copy competencies from set to position
            foreach (var setItem in competencySet.CompetencySetItems)
            {
                // Check if requirement already exists
                var existingReq = await _context.PositionCompetencyRequirements
                    .FirstOrDefaultAsync(pcr => pcr.PositionID == request.PositionID && pcr.CompetencyID == setItem.CompetencyID);

                if (existingReq != null)
                {
                    // Update existing requirement
                    existingReq.RequiredLevel = setItem.RequiredLevel;
                    existingReq.IsMandatory = setItem.IsMandatory;
                    existingReq.ModifiedDate = DateTime.Now;
                    existingReq.ModifiedBy = request.AssignedBy;
                    existingReq.IsActive = true;
                }
                else
                {
                    // Create new requirement
                    var newRequirement = new PositionCompetencyRequirement
                    {
                        PositionID = request.PositionID,
                        CompetencyID = setItem.CompetencyID,
                        RequiredLevel = setItem.RequiredLevel,
                        IsMandatory = setItem.IsMandatory,
                        CreatedDate = DateTime.Now,
                        ModifiedDate = DateTime.Now,
                        ModifiedBy = request.AssignedBy,
                        IsActive = true
                    };

                    _context.PositionCompetencyRequirements.Add(newRequirement);
                }
            }

            await _context.SaveChangesAsync();

            // Return the new assignment
            var assignment = await _context.PositionCompetencySets
                .Include(pcs => pcs.Position)
                .ThenInclude(p => p!.DepartmentNavigation)
                .Include(pcs => pcs.AssignedByEmployee)
                .FirstOrDefaultAsync(pcs => pcs.PositionID == request.PositionID && pcs.SetID == id);

            var dto = new PositionCompetencySetDto
            {
                AssignmentID = assignment!.AssignmentID,
                PositionID = assignment.PositionID,
                SetID = assignment.SetID,
                PositionTitle = assignment.Position!.PositionTitle,
                DepartmentName = assignment.Position.DepartmentNavigation?.DepartmentName,
                AssignedDate = assignment.AssignedDate,
                LastSyncedDate = assignment.LastSyncedDate,
                IsSynced = assignment.IsSynced,
                AssignedByName = assignment.AssignedByEmployee != null ? 
                    $"{assignment.AssignedByEmployee.FirstName} {assignment.AssignedByEmployee.LastName}".Trim() : "",
                CompetencyCount = competencySet.CompetencySetItems.Count
            };

            return Ok(dto);
        }

        // DELETE: api/CompetencySets/{id}/positions/{assignmentId}
        [HttpDelete("{id}/positions/{assignmentId}")]
        public async Task<IActionResult> RemovePositionAssignment(int id, int assignmentId)
        {
            var assignment = await _context.PositionCompetencySets
                .FirstOrDefaultAsync(pcs => pcs.AssignmentID == assignmentId && pcs.SetID == id);

            if (assignment == null)
            {
                return NotFound();
            }

            // Soft delete - don't remove the position requirements
            assignment.IsActive = false;
            assignment.ModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/CompetencySets/{id}/out-of-sync-positions
        [HttpGet("{id}/out-of-sync-positions")]
        public async Task<ActionResult<IEnumerable<PositionCompetencySetDto>>> GetOutOfSyncPositions(int id)
        {
            var assignments = await _context.PositionCompetencySets
                .Include(pcs => pcs.Position)
                .ThenInclude(p => p!.DepartmentNavigation)
                .Include(pcs => pcs.AssignedByEmployee)
                .Where(pcs => pcs.SetID == id && pcs.IsActive && !pcs.IsSynced)
                .Select(pcs => new PositionCompetencySetDto
                {
                    AssignmentID = pcs.AssignmentID,
                    PositionID = pcs.PositionID,
                    SetID = pcs.SetID,
                    PositionTitle = pcs.Position!.PositionTitle,
                    DepartmentName = pcs.Position.DepartmentNavigation != null ? pcs.Position.DepartmentNavigation.DepartmentName : null,
                    AssignedDate = pcs.AssignedDate,
                    LastSyncedDate = pcs.LastSyncedDate,
                    IsSynced = pcs.IsSynced,
                    AssignedByName = pcs.AssignedByEmployee != null ? 
                        $"{pcs.AssignedByEmployee.FirstName} {pcs.AssignedByEmployee.LastName}".Trim() : ""
                })
                .OrderBy(dto => dto.PositionTitle)
                .ToListAsync();

            return Ok(assignments);
        }

        // POST: api/CompetencySets/{id}/sync-positions
        [HttpPost("{id}/sync-positions")]
        public async Task<IActionResult> SyncPositionsWithSet(int id, [FromBody] SyncPositionWithSetRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var competencySet = await _context.CompetencySets
                .Include(cs => cs.CompetencySetItems)
                .FirstOrDefaultAsync(cs => cs.SetID == id && cs.IsActive);

            if (competencySet == null)
            {
                return NotFound("Competency set not found.");
            }

            foreach (var assignmentId in request.AssignmentIDs)
            {
                var assignment = await _context.PositionCompetencySets
                    .FirstOrDefaultAsync(pcs => pcs.AssignmentID == assignmentId && pcs.SetID == id && pcs.IsActive);

                if (assignment == null)
                {
                    continue;
                }

                // Get current position requirements
                var positionRequirements = await _context.PositionCompetencyRequirements
                    .Where(pcr => pcr.PositionID == assignment.PositionID && pcr.IsActive)
                    .ToListAsync();

                var positionReqDict = positionRequirements.ToDictionary(pr => pr.CompetencyID);

                // Update/add competencies from set
                foreach (var setItem in competencySet.CompetencySetItems)
                {
                    if (positionReqDict.ContainsKey(setItem.CompetencyID))
                    {
                        // Update existing
                        var existingReq = positionReqDict[setItem.CompetencyID];
                        existingReq.RequiredLevel = setItem.RequiredLevel;
                        existingReq.IsMandatory = setItem.IsMandatory;
                        existingReq.ModifiedDate = DateTime.Now;
                        existingReq.ModifiedBy = request.ModifiedBy;
                    }
                    else
                    {
                        // Add new
                        var newRequirement = new PositionCompetencyRequirement
                        {
                            PositionID = assignment.PositionID,
                            CompetencyID = setItem.CompetencyID,
                            RequiredLevel = setItem.RequiredLevel,
                            IsMandatory = setItem.IsMandatory,
                            CreatedDate = DateTime.Now,
                            ModifiedDate = DateTime.Now,
                            ModifiedBy = request.ModifiedBy,
                            IsActive = true
                        };

                        _context.PositionCompetencyRequirements.Add(newRequirement);
                    }
                }

                // Update assignment
                assignment.LastSyncedDate = DateTime.Now;
                assignment.SetVersionHash = CalculateSetVersionHash(id);
                assignment.IsSynced = true;
                assignment.ModifiedDate = DateTime.Now;
                assignment.ModifiedBy = request.ModifiedBy;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/CompetencySets/{id}/changes/{positionId}
        [HttpGet("{id}/changes/{positionId}")]
        public async Task<ActionResult<PositionSetChangesDto>> GetPositionSetChanges(int id, int positionId)
        {
            var assignment = await _context.PositionCompetencySets
                .Include(pcs => pcs.Position)
                .FirstOrDefaultAsync(pcs => pcs.SetID == id && pcs.PositionID == positionId && pcs.IsActive);

            if (assignment == null)
            {
                return NotFound("Position assignment not found.");
            }

            var changes = await CompareSetWithPosition(id, positionId);

            var dto = new PositionSetChangesDto
            {
                PositionID = positionId,
                PositionTitle = assignment.Position!.PositionTitle,
                AssignmentID = assignment.AssignmentID,
                Changes = changes
            };

            return Ok(dto);
        }

        #endregion

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
