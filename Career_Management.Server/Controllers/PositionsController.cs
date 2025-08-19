using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PositionsController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public PositionsController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/Positions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PositionDto>>> GetPositions()
        {
            var positions = await _context.Positions
                .Where(p => p.IsActive)
                .Include(p => p.DepartmentNavigation)
                .Include(p => p.LeadershipLevel)
                .Include(p => p.JobGrade)
                .Include(p => p.ModifiedByEmployee)
                .ToListAsync();

            var positionDtos = positions.Select(p => new PositionDto
            {
                PositionID = p.PositionID,
                PositionTitle = p.PositionTitle,
                PositionDescription = p.PositionDescription,
                ExperienceRequirement = p.ExperienceRequirement,
                JobGroup = p.JobGroup,
                JobFunction = p.JobFunction,
                JobFamilyID = p.JobFamilyID,
                DepartmentID = p.DepartmentID,
                JobGradeID = p.JobGradeID,
                JobGradeName = p.JobGrade != null ? p.JobGrade.JobGradeName : null,
                LeadershipID = p.LeadershipID,
                IsActive = p.IsActive,
                CreatedDate = p.CreatedDate,
                ModifiedDate = p.ModifiedDate,
                ModifiedBy = p.ModifiedBy,
                ModifiedByEmployeeName = p.ModifiedByEmployee != null ? $"{p.ModifiedByEmployee.FirstName} {p.ModifiedByEmployee.LastName}".Trim() : null,
                Department = p.Department,
                JobFamily = p.JobFamily,
                DepartmentName = p.DepartmentNavigation != null ? p.DepartmentNavigation.DepartmentName : null,
                LeadershipLevel = p.LeadershipLevel != null ? p.LeadershipLevel.LevelName : null
            }).ToList();

            return positionDtos;
        }

        // GET: api/Positions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PositionDto>> GetPosition(int id)
        {
            var position = await _context.Positions
                .Include(p => p.DepartmentNavigation)
                .Include(p => p.LeadershipLevel)
                .Include(p => p.JobGrade)
                .Include(p => p.ModifiedByEmployee)
                .FirstOrDefaultAsync(p => p.PositionID == id && p.IsActive);

            if (position == null)
            {
                return NotFound();
            }

            var positionDto = new PositionDto
            {
                PositionID = position.PositionID,
                PositionTitle = position.PositionTitle,
                PositionDescription = position.PositionDescription,
                ExperienceRequirement = position.ExperienceRequirement,
                JobGroup = position.JobGroup,
                JobFunction = position.JobFunction,
                JobFamilyID = position.JobFamilyID,
                DepartmentID = position.DepartmentID,
                JobGradeID = position.JobGradeID,
                JobGradeName = position.JobGrade != null ? position.JobGrade.JobGradeName : null,
                LeadershipID = position.LeadershipID,
                IsActive = position.IsActive,
                CreatedDate = position.CreatedDate,
                ModifiedDate = position.ModifiedDate,
                ModifiedBy = position.ModifiedBy,
                ModifiedByEmployeeName = position.ModifiedByEmployee != null ? $"{position.ModifiedByEmployee.FirstName} {position.ModifiedByEmployee.LastName}".Trim() : null,
                Department = position.Department,
                JobFamily = position.JobFamily,
                DepartmentName = position.DepartmentNavigation != null ? position.DepartmentNavigation.DepartmentName : null,
                LeadershipLevel = position.LeadershipLevel != null ? position.LeadershipLevel.LevelName : null
            };

            return positionDto;
        }

        // GET: api/Positions/career-navigator
        [HttpGet("career-navigator")]
        public async Task<ActionResult<IEnumerable<object>>> GetPositionsForCareerNavigator()
        {
                        var positions = await _context.Positions
                .Include(p => p.DepartmentNavigation)
                .Include(p => p.LeadershipLevel)
                .Include(p => p.JobGrade)
                .Include(p => p.CompetencyRequirements) 
                .ThenInclude(pcr => pcr.Competency)
                .Where(p => p.IsActive)
                .Select(p => new
                {
                    PositionID = p.PositionID,
                    PositionTitle = p.PositionTitle,
                    PositionDescription = p.PositionDescription,
                    DepartmentName = p.DepartmentNavigation != null ? p.DepartmentNavigation.DepartmentName : null,
                    JobGrade = p.JobGrade != null ? p.JobGrade.JobGradeName : null,
                    JobGradeLevel = p.JobGrade != null ? p.JobGrade.JobGradeLevel : null,
                    LeadershipLevel = p.LeadershipLevel != null ? p.LeadershipLevel.LevelName : null,
                    ExperienceRequirement = p.ExperienceRequirement,
                    RequiredCompetencies = p.CompetencyRequirements
                        .Where(pcr => pcr.IsActive)
                        .Select(pcr => new
                        {
                            CompetencyID = pcr.CompetencyID,
                            CompetencyName = pcr.Competency != null ? pcr.Competency.CompetencyName : null,
                            RequiredLevel = pcr.RequiredLevel,
                            IsMandatory = pcr.IsMandatory
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(positions);
        }

        // POST: api/Positions
        [HttpPost]
        public async Task<ActionResult<Position>> CreatePosition(Position position)
        {
            position.CreatedDate = DateTime.Now;
            position.ModifiedDate = DateTime.Now;
            position.IsActive = true;
            // ModifiedBy is set from the frontend
            
            _context.Positions.Add(position);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPosition), new { id = position.PositionID }, position);
        }

        // PUT: api/Positions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePosition(int id, Position position)
        {
            if (id != position.PositionID)
            {
                return BadRequest();
            }

            var existingPosition = await _context.Positions.FindAsync(id);
            if (existingPosition == null || !existingPosition.IsActive)
            {
                return NotFound();
            }

            existingPosition.PositionTitle = position.PositionTitle;
            existingPosition.PositionDescription = position.PositionDescription;
            existingPosition.ExperienceRequirement = position.ExperienceRequirement;
            existingPosition.JobGroup = position.JobGroup;
            existingPosition.JobFunction = position.JobFunction;
            existingPosition.JobFamilyID = position.JobFamilyID;
            existingPosition.DepartmentID = position.DepartmentID;
            existingPosition.JobGradeID = position.JobGradeID;
            existingPosition.LeadershipID = position.LeadershipID;
            existingPosition.Department = position.Department;
            existingPosition.JobFamily = position.JobFamily;
            existingPosition.ModifiedDate = DateTime.Now;
            existingPosition.ModifiedBy = position.ModifiedBy; // Set from frontend

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PositionExists(id))
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

        // DELETE: api/Positions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePosition(int id, [FromQuery] int? modifiedBy)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null || !position.IsActive)
            {
                return NotFound();
            }

            position.IsActive = false;
            position.ModifiedDate = DateTime.Now;
            position.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Positions/jobgrades
        [HttpGet("jobgrades")]
        public async Task<ActionResult<IEnumerable<JobGradeDto>>> GetJobGrades()
        {
            var jobGrades = await _context.JobGrades
                .Where(jg => jg.IsActive)
                .Select(jg => new JobGradeDto
                {
                    JobGradeID = jg.JobGradeID,
                    JobGradeName = jg.JobGradeName,
                    JobGradeDescription = jg.JobGradeDescription,
                    JobGradeLevel = jg.JobGradeLevel,
                    IsActive = jg.IsActive
                })
                .OrderBy(jg => jg.JobGradeName)
                .ToListAsync();

            return Ok(jobGrades);
        }

        private bool PositionExists(int id)
        {
            return _context.Positions.Any(e => e.PositionID == id && e.IsActive);
        }
    }
} 