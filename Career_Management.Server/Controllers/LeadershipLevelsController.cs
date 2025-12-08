using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class LeadershipLevelsController : BaseAuthController
    {
        private readonly CareerManagementContext _context;

        public LeadershipLevelsController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/LeadershipLevels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeadershipLevelDto>>> GetLeadershipLevels()
        {
            var leadershipLevels = await _context.LeadershipLevels
                .Where(l => l.IsActive)
                .ToListAsync();

            var leadershipLevelDtos = leadershipLevels.Select(l => new LeadershipLevelDto
            {
                LeadershipID = l.LeadershipID,
                LevelName = l.LevelName,
                CreatedDate = l.CreatedDate,
                ModifiedDate = l.ModifiedDate,
                IsActive = l.IsActive
            }).ToList();

            return leadershipLevelDtos;
        }

        // GET: api/LeadershipLevels/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LeadershipLevelDto>> GetLeadershipLevel(int id)
        {
            var leadershipLevel = await _context.LeadershipLevels
                .FirstOrDefaultAsync(l => l.LeadershipID == id && l.IsActive);

            if (leadershipLevel == null)
            {
                return NotFound();
            }

            var leadershipLevelDto = new LeadershipLevelDto
            {
                LeadershipID = leadershipLevel.LeadershipID,
                LevelName = leadershipLevel.LevelName,
                CreatedDate = leadershipLevel.CreatedDate,
                ModifiedDate = leadershipLevel.ModifiedDate,
                IsActive = leadershipLevel.IsActive
            };

            return leadershipLevelDto;
        }

        // POST: api/LeadershipLevels
        [HttpPost]
        public async Task<ActionResult<LeadershipLevel>> CreateLeadershipLevel(LeadershipLevel leadershipLevel)
        {
            leadershipLevel.CreatedDate = DateTime.Now;
            leadershipLevel.ModifiedDate = DateTime.Now;
            leadershipLevel.IsActive = true;
            
            _context.LeadershipLevels.Add(leadershipLevel);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLeadershipLevel), new { id = leadershipLevel.LeadershipID }, leadershipLevel);
        }

        // PUT: api/LeadershipLevels/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeadershipLevel(int id, LeadershipLevel leadershipLevel)
        {
            if (id != leadershipLevel.LeadershipID)
            {
                return BadRequest();
            }

            var existingLeadershipLevel = await _context.LeadershipLevels.FindAsync(id);
            if (existingLeadershipLevel == null || !existingLeadershipLevel.IsActive)
            {
                return NotFound();
            }

            existingLeadershipLevel.LevelName = leadershipLevel.LevelName;
            existingLeadershipLevel.ModifiedDate = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LeadershipLevelExists(id))
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

        // DELETE: api/LeadershipLevels/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeadershipLevel(int id)
        {
            var leadershipLevel = await _context.LeadershipLevels.FindAsync(id);
            if (leadershipLevel == null || !leadershipLevel.IsActive)
            {
                return NotFound();
            }

            leadershipLevel.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LeadershipLevelExists(int id)
        {
            return _context.LeadershipLevels.Any(e => e.LeadershipID == id && e.IsActive);
        }
    }
} 