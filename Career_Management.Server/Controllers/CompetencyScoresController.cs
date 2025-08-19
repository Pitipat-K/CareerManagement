using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompetencyScoresController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public CompetencyScoresController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/CompetencyScores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompetencyScoreDto>>> GetCompetencyScores()
        {
            var scores = await _context.CompetencyScores
                .Include(cs => cs.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(cs => cs.ModifiedByEmployee)
                .Where(cs => cs.IsActive)
                .OrderBy(cs => cs.CreatedDate)
                .Select(cs => new CompetencyScoreDto
                {
                    ScoreID = cs.ScoreID,
                    AssessmentID = cs.AssessmentID,
                    CompetencyID = cs.CompetencyID,
                    CurrentLevel = cs.CurrentLevel,
                    Comments = cs.Comments,
                    IsActive = cs.IsActive,
                    CreatedDate = cs.CreatedDate,
                    ModifiedDate = cs.ModifiedDate,
                    ModifiedBy = cs.ModifiedBy,
                    ModifiedByEmployeeName = cs.ModifiedByEmployee != null ? $"{cs.ModifiedByEmployee.FirstName} {cs.ModifiedByEmployee.LastName}" : null,
                    CompetencyName = cs.Competency!.CompetencyName,
                    CategoryName = cs.Competency.Category!.CategoryName,
                    DomainName = cs.Competency.Category.Domain!.DomainName
                })
                .ToListAsync();

            return Ok(scores);
        }

        // GET: api/CompetencyScores/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CompetencyScoreDto>> GetCompetencyScore(int id)
        {
            var score = await _context.CompetencyScores
                .Include(cs => cs.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(cs => cs.ModifiedByEmployee)
                .Where(cs => cs.ScoreID == id && cs.IsActive)
                .Select(cs => new CompetencyScoreDto
                {
                    ScoreID = cs.ScoreID,
                    AssessmentID = cs.AssessmentID,
                    CompetencyID = cs.CompetencyID,
                    CurrentLevel = cs.CurrentLevel,
                    Comments = cs.Comments,
                    IsActive = cs.IsActive,
                    CreatedDate = cs.CreatedDate,
                    ModifiedDate = cs.ModifiedDate,
                    ModifiedBy = cs.ModifiedBy,
                    ModifiedByEmployeeName = cs.ModifiedByEmployee != null ? $"{cs.ModifiedByEmployee.FirstName} {cs.ModifiedByEmployee.LastName}" : null,
                    CompetencyName = cs.Competency!.CompetencyName,
                    CategoryName = cs.Competency.Category!.CategoryName,
                    DomainName = cs.Competency.Category.Domain!.DomainName
                })
                .FirstOrDefaultAsync();

            if (score == null)
            {
                return NotFound();
            }

            return Ok(score);
        }

        // GET: api/CompetencyScores/assessment/5
        [HttpGet("assessment/{assessmentId}")]
        public async Task<ActionResult<IEnumerable<CompetencyScoreDto>>> GetCompetencyScoresByAssessment(int assessmentId)
        {
            var scores = await _context.CompetencyScores
                .Include(cs => cs.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(cs => cs.ModifiedByEmployee)
                .Where(cs => cs.AssessmentID == assessmentId && cs.IsActive)
                .OrderBy(cs => cs.CreatedDate)
                .Select(cs => new CompetencyScoreDto
                {
                    ScoreID = cs.ScoreID,
                    AssessmentID = cs.AssessmentID,
                    CompetencyID = cs.CompetencyID,
                    CurrentLevel = cs.CurrentLevel,
                    Comments = cs.Comments,
                    IsActive = cs.IsActive,
                    CreatedDate = cs.CreatedDate,
                    ModifiedDate = cs.ModifiedDate,
                    ModifiedBy = cs.ModifiedBy,
                    ModifiedByEmployeeName = cs.ModifiedByEmployee != null ? $"{cs.ModifiedByEmployee.FirstName} {cs.ModifiedByEmployee.LastName}" : null,
                    CompetencyName = cs.Competency!.CompetencyName,
                    CategoryName = cs.Competency.Category!.CategoryName,
                    DomainName = cs.Competency.Category.Domain!.DomainName
                })
                .ToListAsync();

            return Ok(scores);
        }

        // GET: api/CompetencyScores/employee/5
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<CompetencyScoreDto>>> GetCompetencyScoresByEmployee(int employeeId)
        {
            // Get the latest assessment for the employee
            var latestAssessment = await _context.Assessments
                .Where(a => a.EmployeeID == employeeId && a.IsActive)
                .OrderByDescending(a => a.AssessmentDate)
                .FirstOrDefaultAsync();

            if (latestAssessment == null)
            {
                return Ok(new List<CompetencyScoreDto>());
            }

            var scores = await _context.CompetencyScores
                .Include(cs => cs.Competency)
                .ThenInclude(c => c!.Category)
                .ThenInclude(cat => cat!.Domain)
                .Include(cs => cs.ModifiedByEmployee)
                .Where(cs => cs.AssessmentID == latestAssessment.AssessmentID && cs.IsActive)
                .OrderBy(cs => cs.CreatedDate)
                .Select(cs => new CompetencyScoreDto
                {
                    ScoreID = cs.ScoreID,
                    AssessmentID = cs.AssessmentID,
                    CompetencyID = cs.CompetencyID,
                    CurrentLevel = cs.CurrentLevel,
                    Comments = cs.Comments,
                    IsActive = cs.IsActive,
                    CreatedDate = cs.CreatedDate,
                    ModifiedDate = cs.ModifiedDate,
                    ModifiedBy = cs.ModifiedBy,
                    ModifiedByEmployeeName = cs.ModifiedByEmployee != null ? $"{cs.ModifiedByEmployee.FirstName} {cs.ModifiedByEmployee.LastName}" : null,
                    CompetencyName = cs.Competency!.CompetencyName,
                    CategoryName = cs.Competency.Category!.CategoryName,
                    DomainName = cs.Competency.Category.Domain!.DomainName
                })
                .ToListAsync();

            return Ok(scores);
        }

        // POST: api/CompetencyScores
        [HttpPost]
        public async Task<ActionResult<CompetencyScoreDto>> CreateCompetencyScore(CompetencyScore score)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            score.IsActive = true;
            score.CreatedDate = DateTime.Now;
            score.ModifiedDate = DateTime.Now;
            _context.CompetencyScores.Add(score);
            await _context.SaveChangesAsync();

            var scoreDto = new CompetencyScoreDto
            {
                ScoreID = score.ScoreID,
                AssessmentID = score.AssessmentID,
                CompetencyID = score.CompetencyID,
                CurrentLevel = score.CurrentLevel,
                Comments = score.Comments,
                IsActive = score.IsActive,
                CreatedDate = score.CreatedDate,
                ModifiedDate = score.ModifiedDate,
                ModifiedBy = score.ModifiedBy,
                ModifiedByEmployeeName = null // Will be populated when retrieved
            };

            return CreatedAtAction(nameof(GetCompetencyScore), new { id = score.ScoreID }, scoreDto);
        }

        // PUT: api/CompetencyScores/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCompetencyScore(int id, CompetencyScore score)
        {
            if (id != score.ScoreID)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingScore = await _context.CompetencyScores.FindAsync(id);
            if (existingScore == null)
            {
                return NotFound();
            }

            existingScore.AssessmentID = score.AssessmentID;
            existingScore.CompetencyID = score.CompetencyID;
            existingScore.CurrentLevel = score.CurrentLevel;
            existingScore.Comments = score.Comments;
            existingScore.IsActive = score.IsActive;
            existingScore.ModifiedDate = DateTime.Now;
            existingScore.ModifiedBy = score.ModifiedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CompetencyScoreExists(id))
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

        // DELETE: api/CompetencyScores/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCompetencyScore(int id, [FromQuery] int? modifiedBy)
        {
            var score = await _context.CompetencyScores.FindAsync(id);
            if (score == null)
            {
                return NotFound();
            }

            score.IsActive = false;
            score.ModifiedDate = DateTime.Now;
            score.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CompetencyScoreExists(int id)
        {
            return _context.CompetencyScores.Any(e => e.ScoreID == id);
        }
    }
}
