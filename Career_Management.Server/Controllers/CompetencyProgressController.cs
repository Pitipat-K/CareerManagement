using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompetencyProgressController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public CompetencyProgressController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/CompetencyProgress
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CompetencyProgress>>> GetCompetencyProgress()
        {
            try
            {
                // Query the view directly
                var progressData = await _context.CompetencyProgress
                    .FromSqlRaw("SELECT * FROM vw_CompetencyProgress")
                    .ToListAsync();

                return Ok(progressData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
