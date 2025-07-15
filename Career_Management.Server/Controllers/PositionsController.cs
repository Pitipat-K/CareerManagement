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
                JobGrade = p.JobGrade,
                IsActive = p.IsActive,
                CreatedDate = p.CreatedDate,
                ModifiedDate = p.ModifiedDate,
                Department = p.Department,
                JobFamily = p.JobFamily,
                DepartmentName = p.DepartmentNavigation != null ? p.DepartmentNavigation.DepartmentName : null
            }).ToList();

            return positionDtos;
        }

        // GET: api/Positions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PositionDto>> GetPosition(int id)
        {
            var position = await _context.Positions
                .Include(p => p.DepartmentNavigation)
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
                JobGrade = position.JobGrade,
                IsActive = position.IsActive,
                CreatedDate = position.CreatedDate,
                ModifiedDate = position.ModifiedDate,
                Department = position.Department,
                JobFamily = position.JobFamily,
                DepartmentName = position.DepartmentNavigation != null ? position.DepartmentNavigation.DepartmentName : null
            };

            return positionDto;
        }

        // POST: api/Positions
        [HttpPost]
        public async Task<ActionResult<Position>> CreatePosition(Position position)
        {
            position.CreatedDate = DateTime.Now;
            position.ModifiedDate = DateTime.Now;
            position.IsActive = true;
            
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
            existingPosition.JobGrade = position.JobGrade;
            existingPosition.Department = position.Department;
            existingPosition.JobFamily = position.JobFamily;
            existingPosition.ModifiedDate = DateTime.Now;

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
        public async Task<IActionResult> DeletePosition(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null || !position.IsActive)
            {
                return NotFound();
            }

            position.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PositionExists(int id)
        {
            return _context.Positions.Any(e => e.PositionID == id && e.IsActive);
        }
    }
} 