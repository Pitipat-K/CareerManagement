using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;
using Career_Management.Server.Services;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobFunctionsController : ControllerBase
    {
        private readonly CareerManagementContext _context;
        private readonly IPermissionService _permissionService;

        public JobFunctionsController(CareerManagementContext context, IPermissionService permissionService)
        {
            _context = context;
            _permissionService = permissionService;
        }

        // Helper method to get current user ID
        private async Task<int?> GetCurrentUserIdAsync()
        {
            // TODO: Implement based on your authentication setup
            // This is a placeholder - you might get this from JWT claims, session, etc.
            // For now, return a default user ID for testing
            return 1;
        }

        // Helper method to check permission
        private async Task<bool> CheckPermissionAsync(string permissionCode)
        {
            var currentUserId = await GetCurrentUserIdAsync();
            if (!currentUserId.HasValue) return false;
            
            return await _permissionService.HasPermissionAsync(currentUserId.Value, "JOBFUNCTIONS", permissionCode);
        }

        // GET: api/JobFunctions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobFunctionDto>>> GetJobFunctions()
        {
            // Check permission
            if (!await CheckPermissionAsync("R"))
            {
                return Forbid("Insufficient permissions to view job functions");
            }

            var jobFunctions = await _context.JobFunctions
                .Where(jf => jf.IsActive)
                .Include(jf => jf.Department)
                .Include(jf => jf.ModifiedByEmployee)
                .Select(jf => new JobFunctionDto
                {
                    JobFunctionID = jf.JobFunctionID,
                    JobFunctionName = jf.JobFunctionName,
                    JobFunctionDescription = jf.JobFunctionDescription,
                    DepartmentID = jf.DepartmentID,
                    DepartmentName = jf.Department != null ? jf.Department.DepartmentName : null,
                    CreatedDate = jf.CreatedDate,
                    ModifiedDate = jf.ModifiedDate,
                    ModifiedBy = jf.ModifiedBy,
                    ModifiedByEmployeeName = jf.ModifiedByEmployee != null ? 
                        $"{jf.ModifiedByEmployee.FirstName} {jf.ModifiedByEmployee.LastName}" : null,
                    IsActive = jf.IsActive
                })
                .ToListAsync();

            return Ok(jobFunctions);
        }

        // GET: api/JobFunctions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<JobFunctionDto>> GetJobFunction(int id)
        {
            var jobFunction = await _context.JobFunctions
                .Include(jf => jf.Department)
                .Include(jf => jf.ModifiedByEmployee)
                .FirstOrDefaultAsync(jf => jf.JobFunctionID == id && jf.IsActive);

            if (jobFunction == null)
            {
                return NotFound();
            }

            var jobFunctionDto = new JobFunctionDto
            {
                JobFunctionID = jobFunction.JobFunctionID,
                JobFunctionName = jobFunction.JobFunctionName,
                JobFunctionDescription = jobFunction.JobFunctionDescription,
                DepartmentID = jobFunction.DepartmentID,
                DepartmentName = jobFunction.Department != null ? jobFunction.Department.DepartmentName : null,
                CreatedDate = jobFunction.CreatedDate,
                ModifiedDate = jobFunction.ModifiedDate,
                ModifiedBy = jobFunction.ModifiedBy,
                ModifiedByEmployeeName = jobFunction.ModifiedByEmployee != null ? 
                    $"{jobFunction.ModifiedByEmployee.FirstName} {jobFunction.ModifiedByEmployee.LastName}" : null,
                IsActive = jobFunction.IsActive
            };

            return Ok(jobFunctionDto);
        }

        // POST: api/JobFunctions
        [HttpPost]
        public async Task<ActionResult<JobFunction>> CreateJobFunction([FromBody] JobFunction jobFunction)
        {
            // Check permission
            if (!await CheckPermissionAsync("C"))
            {
                return Forbid("Insufficient permissions to create job functions");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            jobFunction.CreatedDate = DateTime.Now;
            jobFunction.ModifiedDate = DateTime.Now;
            jobFunction.IsActive = true;

            _context.JobFunctions.Add(jobFunction);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJobFunction), new { id = jobFunction.JobFunctionID }, jobFunction);
        }

        // PUT: api/JobFunctions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobFunction(int id, [FromBody] JobFunction jobFunction)
        {
            // Check permission
            if (!await CheckPermissionAsync("U"))
            {
                return Forbid("Insufficient permissions to update job functions");
            }

            if (id != jobFunction.JobFunctionID)
            {
                return BadRequest();
            }

            var existingJobFunction = await _context.JobFunctions.FindAsync(id);
            if (existingJobFunction == null)
            {
                return NotFound();
            }

            existingJobFunction.JobFunctionName = jobFunction.JobFunctionName;
            existingJobFunction.JobFunctionDescription = jobFunction.JobFunctionDescription;
            existingJobFunction.DepartmentID = jobFunction.DepartmentID;
            existingJobFunction.ModifiedDate = DateTime.Now;
            existingJobFunction.ModifiedBy = jobFunction.ModifiedBy;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!JobFunctionExists(id))
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

        // DELETE: api/JobFunctions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobFunction(int id, [FromQuery] int modifiedBy)
        {
            // Check permission
            if (!await CheckPermissionAsync("D"))
            {
                return Forbid("Insufficient permissions to delete job functions");
            }

            var jobFunction = await _context.JobFunctions.FindAsync(id);
            if (jobFunction == null)
            {
                return NotFound();
            }

            // Soft delete
            jobFunction.IsActive = false;
            jobFunction.ModifiedDate = DateTime.Now;
            jobFunction.ModifiedBy = modifiedBy;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool JobFunctionExists(int id)
        {
            return _context.JobFunctions.Any(e => e.JobFunctionID == id);
        }
    }
}
