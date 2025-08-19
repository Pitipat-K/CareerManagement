using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;
using Career_Management.Server.Services;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssessmentCyclesController : ControllerBase
    {
        private readonly CareerManagementContext _context;
        private readonly NotificationService _notificationService;

        public AssessmentCyclesController(CareerManagementContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/AssessmentCycles/employee/{employeeId}
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<AssessmentCycleDto>>> GetEmployeeAssessmentCycles(int employeeId)
        {
            var cycles = await _context.AssessmentCycles
                .Where(ac => ac.EmployeeID == employeeId && ac.IsActive)
                .Include(ac => ac.Employee)
                .Include(ac => ac.CreatedByEmployee)
                .OrderByDescending(ac => ac.CreatedDate)
                .Select(ac => new AssessmentCycleDto
                {
                    CycleID = ac.CycleID,
                    EmployeeID = ac.EmployeeID,
                    AssessmentPeriod = ac.AssessmentPeriod,
                    SelfAssessmentID = ac.SelfAssessmentID,
                    ManagerAssessmentID = ac.ManagerAssessmentID,
                    Status = ac.Status,
                    CreatedBy = ac.CreatedBy,
                    CreatedDate = ac.CreatedDate,
                    SelfCompletedDate = ac.SelfCompletedDate,
                    ManagerCompletedDate = ac.ManagerCompletedDate,
                    IsActive = ac.IsActive,
                    EmployeeName = ac.Employee != null ? ac.Employee.FullName : null,
                    CreatedByName = ac.CreatedByEmployee != null ? ac.CreatedByEmployee.FullName : null
                })
                .ToListAsync();

            return Ok(cycles);
        }

        // GET: api/AssessmentCycles/assessor/{assessorId}
        [HttpGet("assessor/{assessorId}")]
        public async Task<ActionResult<IEnumerable<AssessmentCycleDto>>> GetAssessorAssessmentCycles(int assessorId)
        {
            var cycles = await _context.AssessmentCycles
                .Where(ac => ac.ManagerAssessmentID.HasValue && ac.IsActive)
                .Include(ac => ac.Employee)
                .Include(ac => ac.ManagerAssessment)
                .Include(ac => ac.CreatedByEmployee)
                .Where(ac => ac.ManagerAssessment.AssessorID == assessorId)
                .OrderByDescending(ac => ac.CreatedDate)
                .Select(ac => new AssessmentCycleDto
                {
                    CycleID = ac.CycleID,
                    EmployeeID = ac.EmployeeID,
                    AssessmentPeriod = ac.AssessmentPeriod,
                    SelfAssessmentID = ac.SelfAssessmentID,
                    ManagerAssessmentID = ac.ManagerAssessmentID,
                    Status = ac.Status,
                    CreatedBy = ac.CreatedBy,
                    CreatedDate = ac.CreatedDate,
                    SelfCompletedDate = ac.SelfCompletedDate,
                    ManagerCompletedDate = ac.ManagerCompletedDate,
                    IsActive = ac.IsActive,
                    EmployeeName = ac.Employee != null ? ac.Employee.FullName : null,
                    CreatedByName = ac.CreatedByEmployee != null ? ac.CreatedByEmployee.FullName : null
                })
                .ToListAsync();

            return Ok(cycles);
        }

        // POST: api/AssessmentCycles
        [HttpPost]
        public async Task<ActionResult<AssessmentCycleDto>> CreateAssessmentCycle(CreateAssessmentCycleDto createDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Create Assessment Cycle
                var assessmentCycle = new AssessmentCycle
                {
                    EmployeeID = createDto.EmployeeID,
                    AssessmentPeriod = createDto.AssessmentPeriod,
                    CreatedBy = createDto.CreatedBy,
                    Status = "Pending",
                    IsActive = true
                };

                _context.AssessmentCycles.Add(assessmentCycle);
                await _context.SaveChangesAsync();

                // 2. Create Self Assessment
                var selfAssessment = new Assessment
                {
                    EmployeeID = createDto.EmployeeID,
                    AssessmentPeriod = createDto.AssessmentPeriod,
                    AssessmentType = "Self",
                    Status = "In Progress",
                    CreatedBy = createDto.CreatedBy,
                    IsActive = true
                };

                _context.Assessments.Add(selfAssessment);
                await _context.SaveChangesAsync();

                // 3. Get employee's manager from employee's ManagerID
                var employee = await _context.Employees
                    .Include(e => e.Manager)
                    .FirstOrDefaultAsync(e => e.EmployeeID == createDto.EmployeeID);

                int? managerId = null;
                if (employee?.ManagerID != null)
                {
                    managerId = employee.ManagerID;
                }

                // 4. Create Manager Assessment (but keep it inactive until self is complete)
                var managerAssessment = new Assessment
                {
                    EmployeeID = createDto.EmployeeID,
                    AssessorID = managerId,
                    AssessmentPeriod = createDto.AssessmentPeriod,
                    AssessmentType = "Manager",
                    Status = "Pending",
                    CreatedBy = createDto.CreatedBy,
                    RelatedAssessmentID = selfAssessment.AssessmentID,
                    IsActive = true
                };

                _context.Assessments.Add(managerAssessment);
                await _context.SaveChangesAsync();

                // 5. Update Assessment Cycle with references
                assessmentCycle.SelfAssessmentID = selfAssessment.AssessmentID;
                assessmentCycle.ManagerAssessmentID = managerAssessment.AssessmentID;
                assessmentCycle.Status = "Self_In_Progress";

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Return the created cycle
                var createdCycle = await _context.AssessmentCycles
                    .Where(ac => ac.CycleID == assessmentCycle.CycleID)
                    .Include(ac => ac.Employee)
                    .Include(ac => ac.CreatedByEmployee)
                    .Select(ac => new AssessmentCycleDto
                    {
                        CycleID = ac.CycleID,
                        EmployeeID = ac.EmployeeID,
                        AssessmentPeriod = ac.AssessmentPeriod,
                        SelfAssessmentID = ac.SelfAssessmentID,
                        ManagerAssessmentID = ac.ManagerAssessmentID,
                        Status = ac.Status,
                        CreatedBy = ac.CreatedBy,
                        CreatedDate = ac.CreatedDate,
                        SelfCompletedDate = ac.SelfCompletedDate,
                        ManagerCompletedDate = ac.ManagerCompletedDate,
                        IsActive = ac.IsActive,
                        EmployeeName = ac.Employee != null ? ac.Employee.FullName : null,
                        CreatedByName = ac.CreatedByEmployee != null ? ac.CreatedByEmployee.FullName : null
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetAssessmentCycle), new { id = assessmentCycle.CycleID }, createdCycle);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var errorMessage = $"Failed to create assessment cycle: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorMessage += $"\nInner Exception: {ex.InnerException.Message}";
                }
                return BadRequest(errorMessage);
            }
        }

        // GET: api/AssessmentCycles/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AssessmentCycleDto>> GetAssessmentCycle(int id)
        {
            var cycle = await _context.AssessmentCycles
                .Where(ac => ac.CycleID == id && ac.IsActive)
                .Include(ac => ac.Employee)
                .Include(ac => ac.CreatedByEmployee)
                .Select(ac => new AssessmentCycleDto
                {
                    CycleID = ac.CycleID,
                    EmployeeID = ac.EmployeeID,
                    AssessmentPeriod = ac.AssessmentPeriod,
                    SelfAssessmentID = ac.SelfAssessmentID,
                    ManagerAssessmentID = ac.ManagerAssessmentID,
                    Status = ac.Status,
                    CreatedBy = ac.CreatedBy,
                    CreatedDate = ac.CreatedDate,
                    SelfCompletedDate = ac.SelfCompletedDate,
                    ManagerCompletedDate = ac.ManagerCompletedDate,
                    IsActive = ac.IsActive,
                    EmployeeName = ac.Employee != null ? ac.Employee.FullName : null,
                    CreatedByName = ac.CreatedByEmployee != null ? ac.CreatedByEmployee.FullName : null
                })
                .FirstOrDefaultAsync();

            if (cycle == null)
            {
                return NotFound();
            }

            return Ok(cycle);
        }

        // PUT: api/AssessmentCycles/{id}/complete-self
        [HttpPut("{id}/complete-self")]
        public async Task<IActionResult> CompleteSelfAssessment(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var cycle = await _context.AssessmentCycles
                    .Include(ac => ac.SelfAssessment)
                    .Include(ac => ac.ManagerAssessment)
                    .Include(ac => ac.Employee)
                        .ThenInclude(e => e.Position)
                            .ThenInclude(p => p.DepartmentNavigation)
                    .FirstOrDefaultAsync(ac => ac.CycleID == id);

                if (cycle == null)
                {
                    return NotFound("Assessment cycle not found");
                }

                if (cycle.SelfAssessment == null)
                {
                    return BadRequest("Self assessment not found");
                }

                // 1. Update self assessment status
                cycle.SelfAssessment.Status = "Completed";
                cycle.SelfAssessment.ModifiedDate = DateTime.Now;

                // 2. Update cycle status and notify manager
                cycle.Status = "Manager_Notified";
                cycle.SelfCompletedDate = DateTime.Now;

                // 3. Activate manager assessment
                if (cycle.ManagerAssessment != null)
                {
                    cycle.ManagerAssessment.Status = "In Progress";
                    cycle.ManagerAssessment.ModifiedDate = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 4. Send notification to manager (fire and forget)
                Console.WriteLine($"Starting notification process for cycle {cycle.CycleID}");
                _ = Task.Run(async () =>
                {
                    try
                    {
                        Console.WriteLine($"Executing notification for cycle {cycle.CycleID}");
                        await SendManagerNotificationAsync(cycle);
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't fail the assessment completion
                        Console.WriteLine($"Error sending notification: {ex.Message}");
                        Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    }
                });

                return Ok();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Failed to complete self assessment: {ex.Message}");
            }
        }

        private async Task SendManagerNotificationAsync(AssessmentCycle cycle)
        {
            try
            {
                Console.WriteLine($"SendManagerNotificationAsync called for cycle {cycle.CycleID}");
                Console.WriteLine($"Manager Assessment ID: {cycle.ManagerAssessmentID}");
                Console.WriteLine($"Manager Assessor ID: {cycle.ManagerAssessment?.AssessorID}");
                
                // Get the employee's manager from employee's ManagerID
                var employee = cycle.Employee;
                var managerId = employee?.ManagerID;
                Employee manager = null;
                if (managerId.HasValue)
                {
                    manager = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeID == managerId.Value);
                }
                Console.WriteLine($"Manager found: {manager != null}");
                if (manager != null)
                {
                    Console.WriteLine($"Manager email: {manager.Email}");
                }
                
                if (manager == null || string.IsNullOrEmpty(manager.Email))
                {
                    Console.WriteLine($"Manager not found or no email for manager ID: {managerId}");
                    return;
                }

                // Get employee information
                var position = employee?.Position;
                var department = position?.DepartmentNavigation;

                // Calculate assessment statistics
                var competencyScores = await _context.CompetencyScores
                    .Where(cs => cs.AssessmentID == cycle.SelfAssessmentID)
                    .ToListAsync();

                var totalCompetencies = competencyScores.Count;
                var averageScore = totalCompetencies > 0 ? competencyScores.Average(cs => cs.CurrentLevel) : 0;
                
                // Get required levels from position competency requirements
                var positionId = employee?.PositionID;
                var competenciesNeedingAttention = 0;
                
                if (positionId.HasValue)
                {
                    var positionRequirements = await _context.PositionCompetencyRequirements
                        .Where(pcr => pcr.PositionID == positionId.Value && pcr.IsActive)
                        .ToListAsync();
                    
                    competenciesNeedingAttention = competencyScores.Count(cs => 
                    {
                        var requirement = positionRequirements.FirstOrDefault(pr => pr.CompetencyID == cs.CompetencyID);
                        return requirement != null && cs.CurrentLevel < requirement.RequiredLevel;
                    });
                }

                // Send notification
                var success = await _notificationService.SendAssessmentCompletionNotificationAsync(
                    employeeName: employee?.FullName ?? "Unknown Employee",
                    managerEmail: manager.Email,
                    managerName: manager.FullName,
                    positionTitle: position?.PositionTitle ?? "Unknown Position",
                    departmentName: department?.DepartmentName ?? "Unknown Department",
                    assessmentPeriod: cycle.AssessmentPeriod,
                    completionDate: cycle.SelfCompletedDate ?? DateTime.Now,
                    totalCompetencies: totalCompetencies,
                    averageScore: averageScore,
                    competenciesNeedingAttention: competenciesNeedingAttention
                );

                if (success)
                {
                    Console.WriteLine($"Notification sent successfully to manager {manager.Email}");
                }
                else
                {
                    Console.WriteLine($"Failed to send notification to manager {manager.Email}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SendManagerNotificationAsync: {ex.Message}");
            }
        }

        // PUT: api/AssessmentCycles/{id}/start-manager
        [HttpPut("{id}/start-manager")]
        public async Task<IActionResult> StartManagerAssessment(int id)
        {
            var cycle = await _context.AssessmentCycles.FindAsync(id);
            if (cycle == null)
            {
                return NotFound("Assessment cycle not found");
            }

            cycle.Status = "Manager_In_Progress";
            await _context.SaveChangesAsync();

            return Ok();
        }

        // PUT: api/AssessmentCycles/{id}/complete-manager
        [HttpPut("{id}/complete-manager")]
        public async Task<IActionResult> CompleteManagerAssessment(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var cycle = await _context.AssessmentCycles
                    .Include(ac => ac.ManagerAssessment)
                    .FirstOrDefaultAsync(ac => ac.CycleID == id);

                if (cycle == null)
                {
                    return NotFound("Assessment cycle not found");
                }

                if (cycle.ManagerAssessment == null)
                {
                    return BadRequest("Manager assessment not found");
                }

                // 1. Update manager assessment status
                cycle.ManagerAssessment.Status = "Completed";
                cycle.ManagerAssessment.ModifiedDate = DateTime.Now;

                // 2. Update cycle status to completed
                cycle.Status = "Completed";
                cycle.ManagerCompletedDate = DateTime.Now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Failed to complete manager assessment: {ex.Message}");
            }
        }

        // PUT: api/AssessmentCycles/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateAssessmentCycleStatus(int id, UpdateAssessmentCycleStatusDto statusDto)
        {
            var cycle = await _context.AssessmentCycles.FindAsync(id);
            if (cycle == null)
            {
                return NotFound();
            }

            cycle.Status = statusDto.Status;
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
} 