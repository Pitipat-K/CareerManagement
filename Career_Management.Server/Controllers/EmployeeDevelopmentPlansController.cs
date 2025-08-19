using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeeDevelopmentPlansController : ControllerBase
    {
        private readonly CareerManagementContext _context;
        public EmployeeDevelopmentPlansController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/EmployeeDevelopmentPlans/employee/{employeeId}/year/{year}
        [HttpGet("employee/{employeeId}/year/{year}")]
        public async Task<ActionResult<IEnumerable<EmployeeDevelopmentPlanDto>>> GetPlansForEmployeeYear(int employeeId, int year)
        {
            var plans = await _context.EmployeeDevelopmentPlans
                .Where(p => p.EmployeeID == employeeId && p.PlanYear == year && p.IsActive)
                .Include(p => p.Competency)
                .Include(p => p.ModifiedByEmployee)
                .ToListAsync();

            var dtos = plans.Select(p => new EmployeeDevelopmentPlanDto
            {
                DevelopmentPlanID = p.DevelopmentPlanID,
                EmployeeID = p.EmployeeID,
                CompetencyID = p.CompetencyID,
                CompetencyName = p.Competency?.CompetencyName,
                LearningWay = p.LearningWay,
                Priority = p.Priority,
                TargetDate = p.TargetDate.ToString("yyyy-MM-dd"),
                Status = p.Status,
                PlanYear = p.PlanYear,
                IsActive = p.IsActive,
                CreatedDate = p.CreatedDate,
                ModifiedDate = p.ModifiedDate,
                ModifiedBy = p.ModifiedBy,
                ModifiedByEmployeeName = p.ModifiedByEmployee != null ? $"{p.ModifiedByEmployee.FirstName} {p.ModifiedByEmployee.LastName}" : null
            }).ToList();

            return Ok(dtos);
        }

        // POST: api/EmployeeDevelopmentPlans
        [HttpPost]
        public async Task<ActionResult<EmployeeDevelopmentPlanDto>> CreatePlan(EmployeeDevelopmentPlanDto dto)
        {
            var plan = new EmployeeDevelopmentPlan
            {
                EmployeeID = dto.EmployeeID,
                CompetencyID = dto.CompetencyID,
                LearningWay = dto.LearningWay,
                Priority = dto.Priority,
                TargetDate = DateTime.Parse(dto.TargetDate),
                Status = dto.Status,
                PlanYear = dto.PlanYear,
                CreatedDate = DateTime.Now,
                ModifiedDate = DateTime.Now,
                ModifiedBy = dto.ModifiedBy,
                IsActive = true
            };
            _context.EmployeeDevelopmentPlans.Add(plan);
            await _context.SaveChangesAsync();
            dto.DevelopmentPlanID = plan.DevelopmentPlanID;
            return CreatedAtAction(nameof(GetPlansForEmployeeYear), new { employeeId = plan.EmployeeID, year = plan.PlanYear }, dto);
        }

        // PUT: api/EmployeeDevelopmentPlans/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlan(int id, EmployeeDevelopmentPlanDto dto)
        {
            var plan = await _context.EmployeeDevelopmentPlans.FindAsync(id);
            if (plan == null || !plan.IsActive) return NotFound();
            plan.CompetencyID = dto.CompetencyID;
            plan.LearningWay = dto.LearningWay;
            plan.Priority = dto.Priority;
            plan.TargetDate = DateTime.Parse(dto.TargetDate);
            plan.Status = dto.Status;
            plan.PlanYear = dto.PlanYear;
            plan.ModifiedDate = DateTime.Now;
            plan.ModifiedBy = dto.ModifiedBy;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/EmployeeDevelopmentPlans/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlan(int id, [FromQuery] int? modifiedBy)
        {
            var plan = await _context.EmployeeDevelopmentPlans.FindAsync(id);
            if (plan == null || !plan.IsActive) return NotFound();
            plan.IsActive = false;
            plan.ModifiedDate = DateTime.Now;
            plan.ModifiedBy = modifiedBy;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
} 