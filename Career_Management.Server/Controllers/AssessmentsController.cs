using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;
using Career_Management.Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class AssessmentsController : BaseAuthController
    {
        private readonly CareerManagementContext _context;
        private readonly NotificationService _notificationService;

        public AssessmentsController(CareerManagementContext context, NotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/Assessments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AssessmentDto>>> GetAssessments()
        {
            var assessments = await _context.Assessments
                .Where(a => a.IsActive)
                .Include(a => a.Employee)
                .Include(a => a.Assessor)
                .Include(a => a.CreatedByEmployee)
                .OrderByDescending(a => a.AssessmentDate)
                .Select(a => new AssessmentDto
                {
                    AssessmentID = a.AssessmentID,
                    EmployeeID = a.EmployeeID,
                    AssessorID = a.AssessorID,
                    AssessmentDate = a.AssessmentDate,
                    AssessmentPeriod = a.AssessmentPeriod,
                    Status = a.Status,
                    CreatedBy = a.CreatedBy,
                    IsActive = a.IsActive,
                    EmployeeName = a.Employee != null ? a.Employee.FullName : null,
                    AssessorName = a.Assessor != null ? a.Assessor.FullName : null,
                    CreatedByName = a.CreatedByEmployee != null ? a.CreatedByEmployee.FullName : null,
                    AssessmentType = a.AssessmentType
                })
                .ToListAsync();

            return Ok(assessments);
        }

        // GET: api/Assessments/employee/{employeeId}
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<AssessmentDto>>> GetEmployeeAssessments(int employeeId)
        {
            var assessments = await _context.Assessments
                .Where(a => a.EmployeeID == employeeId && a.IsActive)
                .Include(a => a.Employee)
                .Include(a => a.Assessor)
                .Include(a => a.CreatedByEmployee)
                .OrderByDescending(a => a.AssessmentDate)
                .Select(a => new AssessmentDto
                {
                    AssessmentID = a.AssessmentID,
                    EmployeeID = a.EmployeeID,
                    AssessorID = a.AssessorID,
                    AssessmentDate = a.AssessmentDate,
                    AssessmentPeriod = a.AssessmentPeriod,
                    Status = a.Status,
                    CreatedBy = a.CreatedBy,
                    IsActive = a.IsActive,
                    EmployeeName = a.Employee != null ? a.Employee.FullName : null,
                    AssessorName = a.Assessor != null ? a.Assessor.FullName : null,
                    CreatedByName = a.CreatedByEmployee != null ? a.CreatedByEmployee.FullName : null,
                    AssessmentType = a.AssessmentType
                })
                .ToListAsync();

            return Ok(assessments);
        }

        // GET: api/Assessments/assessor/{assessorId}
        [HttpGet("assessor/{assessorId}")]
        public async Task<ActionResult<IEnumerable<AssessmentDto>>> GetAssessorAssessments(int assessorId)
        {
            var assessments = await _context.Assessments
                .Where(a => a.AssessorID == assessorId && a.IsActive)
                .Include(a => a.Employee)
                .Include(a => a.Assessor)
                .Include(a => a.CreatedByEmployee)
                .OrderByDescending(a => a.AssessmentDate)
                .Select(a => new AssessmentDto
                {
                    AssessmentID = a.AssessmentID,
                    EmployeeID = a.EmployeeID,
                    AssessorID = a.AssessorID,
                    AssessmentDate = a.AssessmentDate,
                    AssessmentPeriod = a.AssessmentPeriod,
                    Status = a.Status,
                    CreatedBy = a.CreatedBy,
                    IsActive = a.IsActive,
                    EmployeeName = a.Employee != null ? a.Employee.FullName : null,
                    AssessorName = a.Assessor != null ? a.Assessor.FullName : null,
                    CreatedByName = a.CreatedByEmployee != null ? a.CreatedByEmployee.FullName : null,
                    AssessmentType = a.AssessmentType
                })
                .ToListAsync();

            return Ok(assessments);
        }

        // POST: api/Assessments
        [HttpPost]
        public async Task<ActionResult<AssessmentDto>> CreateAssessment(CreateAssessmentDto createDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate that the employee exists
                var existingEmployee = await _context.Employees
                    .Include(e => e.Position)
                    .ThenInclude(p => p.DepartmentNavigation)
                    .FirstOrDefaultAsync(e => e.EmployeeID == createDto.EmployeeID);

                if (existingEmployee == null)
                {
                    return BadRequest($"Employee with ID {createDto.EmployeeID} not found");
                }

                // 1. Create Assessment Cycle
                var assessmentCycle = new AssessmentCycle
                {
                    EmployeeID = createDto.EmployeeID,
                    AssessmentPeriod = createDto.AssessmentPeriod,
                    CreatedBy = createDto.EmployeeID,
                    Status = "Pending",
                    IsActive = true
                };

                Console.WriteLine($"Creating assessment cycle for EmployeeID: {createDto.EmployeeID}, Period: {createDto.AssessmentPeriod}");
                _context.AssessmentCycles.Add(assessmentCycle);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Assessment cycle created with ID: {assessmentCycle.CycleID}");

                // 2. Create Self Assessment
                var selfAssessment = new Assessment
                {
                    EmployeeID = createDto.EmployeeID,
                    AssessmentPeriod = createDto.AssessmentPeriod,
                    AssessmentType = "Self",
                    Status = "In Progress",
                    CreatedBy = createDto.EmployeeID,
                    IsActive = true
                };

                Console.WriteLine($"Creating self assessment for EmployeeID: {createDto.EmployeeID}");
                _context.Assessments.Add(selfAssessment);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Self assessment created with ID: {selfAssessment.AssessmentID}");

                // 3. Get employee's manager from employee's ManagerID
                int? managerId = null;
                if (existingEmployee?.ManagerID != null)
                {
                    managerId = existingEmployee.ManagerID;
                }

                // 4. Create Manager Assessment (but keep it inactive until self is complete)
                var managerAssessment = new Assessment
                {
                    EmployeeID = createDto.EmployeeID,
                    AssessorID = managerId,
                    AssessmentPeriod = createDto.AssessmentPeriod,
                    AssessmentType = "Manager",
                    Status = "Pending",
                    CreatedBy = createDto.EmployeeID,
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

                // Return the self assessment
                var createdAssessment = await _context.Assessments
                    .Where(a => a.AssessmentID == selfAssessment.AssessmentID)
                    .Include(a => a.Employee)
                    .Include(a => a.CreatedByEmployee)
                    .Select(a => new AssessmentDto
                    {
                        AssessmentID = a.AssessmentID,
                        EmployeeID = a.EmployeeID,
                        AssessorID = a.AssessorID,
                        AssessmentDate = a.AssessmentDate,
                        AssessmentPeriod = a.AssessmentPeriod,
                        Status = a.Status,
                        CreatedBy = a.CreatedBy,
                        IsActive = a.IsActive,
                        EmployeeName = a.Employee != null ? a.Employee.FullName : null,
                        CreatedByName = a.CreatedByEmployee != null ? a.CreatedByEmployee.FullName : null
                    })
                    .FirstOrDefaultAsync();

                return CreatedAtAction(nameof(GetAssessment), new { id = selfAssessment.AssessmentID }, createdAssessment);
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

        // GET: api/Assessments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AssessmentDto>> GetAssessment(int id)
        {
            var assessment = await _context.Assessments
                .Where(a => a.AssessmentID == id && a.IsActive)
                .Include(a => a.Employee)
                .Include(a => a.Assessor)
                .Include(a => a.CreatedByEmployee)
                .Select(a => new AssessmentDto
                {
                    AssessmentID = a.AssessmentID,
                    EmployeeID = a.EmployeeID,
                    AssessorID = a.AssessorID,
                    AssessmentDate = a.AssessmentDate,
                    AssessmentPeriod = a.AssessmentPeriod,
                    Status = a.Status,
                    CreatedBy = a.CreatedBy,
                    IsActive = a.IsActive,
                    EmployeeName = a.Employee != null ? a.Employee.FullName : null,
                    AssessorName = a.Assessor != null ? a.Assessor.FullName : null,
                    CreatedByName = a.CreatedByEmployee != null ? a.CreatedByEmployee.FullName : null,
                    AssessmentType = a.AssessmentType
                })
                .FirstOrDefaultAsync();

            if (assessment == null)
            {
                return NotFound();
            }

            return Ok(assessment);
        }

        // GET: api/Assessments/{id}/competencies
        [HttpGet("{id}/competencies")]
        public async Task<ActionResult<AssessmentWithCompetenciesDto>> GetAssessmentWithCompetencies(int id)
        {
            var assessment = await _context.Assessments
                .Where(a => a.AssessmentID == id && a.IsActive)
                .Include(a => a.Employee)
                .FirstOrDefaultAsync();

            if (assessment == null)
            {
                return NotFound();
            }

            if (assessment.Employee == null)
            {
                return BadRequest("Employee not found for this assessment");
            }

            if (assessment.Employee.PositionID <= 0)
            {
                return BadRequest("Employee does not have a valid position assigned");
            }

            var positionRequirements = await _context.PositionCompetencyRequirements
                .Where(pcr => pcr.PositionID == assessment.Employee.PositionID && pcr.IsActive)
                .Include(pcr => pcr.Competency)
                .ThenInclude(c => c.Category)
                .ThenInclude(cat => cat.Domain)
                .ToListAsync();

            var competencies = new List<CompetencyAssessmentDto>();

            // If this is a manager assessment, get the related self-assessment
            int? selfAssessmentId = null;
            if (assessment.AssessmentType == "Manager" && assessment.RelatedAssessmentID.HasValue)
            {
                selfAssessmentId = assessment.RelatedAssessmentID.Value;
            }

            foreach (var requirement in positionRequirements)
            {
                if (requirement.Competency?.Category?.Domain == null)
                {
                    continue;
                }

                int? selfLevel = null;
                int? managerLevel = null;
                string? comments = null;

                // Get self-level from self-assessment if this is a manager assessment
                if (selfAssessmentId.HasValue)
                {
                    var selfScore = await _context.CompetencyScores
                        .Where(cs => cs.AssessmentID == selfAssessmentId.Value && cs.CompetencyID == requirement.CompetencyID && cs.IsActive)
                        .FirstOrDefaultAsync();
                    selfLevel = selfScore?.CurrentLevel;
                }
                // If not a manager assessment, get self-level from current assessment
                else
                {
                    var selfScore = await _context.CompetencyScores
                        .Where(cs => cs.AssessmentID == id && cs.CompetencyID == requirement.CompetencyID && cs.IsActive)
                        .FirstOrDefaultAsync();
                    selfLevel = selfScore?.CurrentLevel;
                }

                // Get manager-level from current assessment if this is a manager assessment
                if (assessment.AssessmentType == "Manager")
                {
                    var managerScore = await _context.CompetencyScores
                        .Where(cs => cs.AssessmentID == id && cs.CompetencyID == requirement.CompetencyID && cs.IsActive)
                        .FirstOrDefaultAsync();
                    managerLevel = managerScore?.CurrentLevel;
                    comments = managerScore?.Comments;
                }
                else
                {
                    comments = null;
                }

                competencies.Add(new CompetencyAssessmentDto
                {
                    CompetencyID = requirement.CompetencyID,
                    CompetencyName = requirement.Competency!.CompetencyName,
                    CategoryName = requirement.Competency.Category!.CategoryName,
                    DomainName = requirement.Competency.Category.Domain!.DomainName,
                    RequiredLevel = requirement.RequiredLevel,
                    SelfLevel = selfLevel,
                    ManagerLevel = managerLevel,
                    Comments = comments,
                    DomainDisplayOrder = requirement.Competency.Category.Domain.DisplayOrder ?? int.MaxValue,
                    CategoryDisplayOrder = requirement.Competency.Category.DisplayOrder ?? int.MaxValue,
                    CompetencyDisplayOrder = requirement.Competency.DisplayOrder ?? int.MaxValue
                });
            }

            var orderedCompetencies = competencies
                .OrderBy(c => c.DomainDisplayOrder)
                .ThenBy(c => c.CategoryDisplayOrder)
                .ThenBy(c => c.CompetencyDisplayOrder)
                .ToList();

            var result = new AssessmentWithCompetenciesDto
            {
                AssessmentID = assessment.AssessmentID,
                EmployeeID = assessment.EmployeeID,
                AssessmentPeriod = assessment.AssessmentPeriod,
                Status = assessment.Status,
                Competencies = orderedCompetencies
            };

            return Ok(result);
        }

        // GET: api/Assessments/cycle/{cycleId}/combined
        [HttpGet("cycle/{cycleId}/combined")]
        public async Task<ActionResult<AssessmentWithCompetenciesDto>> GetCombinedAssessmentView(int cycleId)
        {
            Console.WriteLine($"GetCombinedAssessmentView called with cycleId: {cycleId}");
            
            var cycle = await _context.AssessmentCycles
                .Where(ac => ac.CycleID == cycleId && ac.IsActive)
                .Include(ac => ac.Employee)
                .Include(ac => ac.SelfAssessment)
                .Include(ac => ac.ManagerAssessment)
                .FirstOrDefaultAsync();

            if (cycle == null)
            {
                Console.WriteLine($"Assessment cycle {cycleId} not found");
                return NotFound("Assessment cycle not found");
            }

            Console.WriteLine($"Found cycle {cycleId}, SelfAssessmentID: {cycle.SelfAssessmentID}, ManagerAssessmentID: {cycle.ManagerAssessmentID}, Status: {cycle.Status}");

            if (cycle.Employee == null)
            {
                return BadRequest("Employee not found for this assessment cycle");
            }

            if (cycle.Employee.PositionID <= 0)
            {
                return BadRequest("Employee does not have a valid position assigned");
            }

            var positionRequirements = await _context.PositionCompetencyRequirements
                .Where(pcr => pcr.PositionID == cycle.Employee.PositionID && pcr.IsActive)
                .Include(pcr => pcr.Competency)
                .ThenInclude(c => c.Category)
                .ThenInclude(cat => cat.Domain)
                .ToListAsync();

            Console.WriteLine($"Found {positionRequirements.Count} position requirements");

            var competencies = new List<CompetencyAssessmentDto>();

            foreach (var requirement in positionRequirements)
            {
                if (requirement.Competency?.Category?.Domain == null)
                {
                    continue;
                }

                int? selfLevel = null;
                int? managerLevel = null;
                string? comments = null;

                // Get self-level from self-assessment
                if (cycle.SelfAssessmentID.HasValue)
                {
                    var selfScore = await _context.CompetencyScores
                        .Where(cs => cs.AssessmentID == cycle.SelfAssessmentID.Value && cs.CompetencyID == requirement.CompetencyID && cs.IsActive)
                        .FirstOrDefaultAsync();
                    selfLevel = selfScore?.CurrentLevel;
                    Console.WriteLine($"Self score for competency {requirement.CompetencyID}: {selfLevel}");
                }

                // Get manager-level from manager-assessment
                if (cycle.ManagerAssessmentID.HasValue)
                {
                    var managerScore = await _context.CompetencyScores
                        .Where(cs => cs.AssessmentID == cycle.ManagerAssessmentID.Value && cs.CompetencyID == requirement.CompetencyID && cs.IsActive)
                        .FirstOrDefaultAsync();
                    managerLevel = managerScore?.CurrentLevel;
                    comments = managerScore?.Comments;
                    Console.WriteLine($"Manager score for competency {requirement.CompetencyID}: {managerLevel}");
                }

                competencies.Add(new CompetencyAssessmentDto
                {
                    CompetencyID = requirement.CompetencyID,
                    CompetencyName = requirement.Competency!.CompetencyName,
                    CategoryName = requirement.Competency.Category!.CategoryName,
                    DomainName = requirement.Competency.Category.Domain!.DomainName,
                    RequiredLevel = requirement.RequiredLevel,
                    SelfLevel = selfLevel,
                    ManagerLevel = managerLevel,
                    Comments = comments,
                    DomainDisplayOrder = requirement.Competency.Category.Domain.DisplayOrder ?? int.MaxValue,
                    CategoryDisplayOrder = requirement.Competency.Category.DisplayOrder ?? int.MaxValue,
                    CompetencyDisplayOrder = requirement.Competency.DisplayOrder ?? int.MaxValue
                });
            }

            var orderedCompetencies = competencies
                .OrderBy(c => c.DomainDisplayOrder)
                .ThenBy(c => c.CategoryDisplayOrder)
                .ThenBy(c => c.CompetencyDisplayOrder)
                .ToList();

            Console.WriteLine($"Returning {orderedCompetencies.Count} competencies with manager levels: {orderedCompetencies.Count(c => c.ManagerLevel.HasValue)}");

            var result = new AssessmentWithCompetenciesDto
            {
                AssessmentID = cycle.SelfAssessmentID ?? 0, // Use self assessment ID as primary
                EmployeeID = cycle.EmployeeID,
                AssessmentPeriod = cycle.AssessmentPeriod,
                Status = cycle.Status,
                Competencies = orderedCompetencies
            };

            return Ok(result);
        }

        // POST: api/Assessments/{id}/scores
        [HttpPost("{id}/scores")]
        public async Task<ActionResult> UpdateCompetencyScore(int id, UpdateCompetencyScoreDto updateDto)
        {
            var assessment = await _context.Assessments
                .Where(a => a.AssessmentID == id && a.IsActive)
                .FirstOrDefaultAsync();

            if (assessment == null)
            {
                return NotFound("Assessment not found");
            }

            var existingScore = await _context.CompetencyScores
                .Where(cs => cs.AssessmentID == id && cs.CompetencyID == updateDto.CompetencyID && cs.IsActive)
                .FirstOrDefaultAsync();

            if (existingScore != null)
            {
                // Update existing score
                existingScore.CurrentLevel = updateDto.CurrentLevel;
                existingScore.Comments = updateDto.Comments;
                existingScore.ModifiedDate = DateTime.Now;
                existingScore.ModifiedBy = updateDto.ModifiedBy;
            }
            else
            {
                // Create new score
                var newScore = new CompetencyScore
                {
                    AssessmentID = id,
                    CompetencyID = updateDto.CompetencyID,
                    CurrentLevel = updateDto.CurrentLevel,
                    Comments = updateDto.Comments,
                    IsActive = true,
                    CreatedDate = DateTime.Now,
                    ModifiedDate = DateTime.Now,
                    ModifiedBy = updateDto.ModifiedBy
                };
                _context.CompetencyScores.Add(newScore);
            }

            await _context.SaveChangesAsync();

            return Ok();
        }

        // GET: api/Assessments/{id}/status (for testing)
        [HttpGet("{id}/status")]
        public async Task<IActionResult> GetAssessmentStatus(int id)
        {
            Console.WriteLine($"GetAssessmentStatus called with id: {id}");
            
            var assessment = await _context.Assessments.FindAsync(id);
            if (assessment == null)
            {
                Console.WriteLine($"Assessment with id {id} not found");
                return NotFound();
            }

            Console.WriteLine($"Found assessment {id} with status: {assessment.Status}");
            return Ok(new { Status = assessment.Status });
        }

        // PUT: api/Assessments/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateAssessmentStatus(int id, UpdateAssessmentStatusDto statusDto)
        {
            Console.WriteLine($"UpdateAssessmentStatus called with id: {id}, status: {statusDto.Status}");
            
            var assessment = await _context.Assessments.FindAsync(id);
            if (assessment == null)
            {
                Console.WriteLine($"Assessment with id {id} not found");
                return NotFound();
            }

            Console.WriteLine($"Found assessment {id}, updating status from {assessment.Status} to {statusDto.Status}");
            assessment.Status = statusDto.Status;
            
            // Only set AssessorID to EmployeeID for Self assessments when completed
            // For Manager assessments, AssessorID should remain as the manager's ID
            if (statusDto.Status.ToLower() == "completed" && assessment.AssessmentType == "Self")
            {
                assessment.AssessorID = assessment.EmployeeID;
                
                // Activate manager assessment if this is a self assessment being completed
                try
                {
                    // Find the related manager assessment
                    var managerAssessment = await _context.Assessments
                        .Where(a => a.RelatedAssessmentID == assessment.AssessmentID && 
                                  a.AssessmentType == "Manager" && 
                                  a.IsActive)
                        .FirstOrDefaultAsync();

                    if (managerAssessment != null)
                    {
                        managerAssessment.Status = "In Progress";
                        managerAssessment.ModifiedDate = DateTime.Now;
                        Console.WriteLine($"Manager assessment {managerAssessment.AssessmentID} activated to 'In Progress' via status update");
                    }
                    else
                    {
                        Console.WriteLine($"No manager assessment found for self assessment {assessment.AssessmentID} via status update");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error activating manager assessment via status update: {ex.Message}");
                }
            }
            
            await _context.SaveChangesAsync();
            Console.WriteLine($"Assessment {id} status updated successfully");

            return Ok();
        }

        // DELETE: api/Assessments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssessment(int id)
        {
            var assessment = await _context.Assessments.FindAsync(id);
            if (assessment == null)
            {
                return NotFound();
            }

            assessment.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Assessments/{id}/send-notification
        [HttpPost("{id}/send-notification")]
        public async Task<IActionResult> SendAssessmentNotification(int id)
        {
            try
            {
                // Get assessment details
                var assessment = await _context.Assessments
                    .Include(a => a.Employee)
                        .ThenInclude(e => e.Position)
                            .ThenInclude(p => p.DepartmentNavigation)
                    .FirstOrDefaultAsync(a => a.AssessmentID == id);

                if (assessment == null)
                {
                    return NotFound("Assessment not found");
                }

                // Get competency scores for statistics
                var competencyScores = await _context.CompetencyScores
                    .Where(cs => cs.AssessmentID == id && cs.IsActive)
                    .ToListAsync();

                var totalCompetencies = competencyScores.Count;
                var averageScore = totalCompetencies > 0 ? competencyScores.Average(cs => cs.CurrentLevel) : 0;

                // Calculate competencies needing attention
                var positionRequirements = await _context.PositionCompetencyRequirements
                    .Where(pcr => pcr.PositionID == assessment.Employee.PositionID && pcr.IsActive)
                    .ToListAsync();

                var competenciesNeedingAttention = competencyScores.Count(cs =>
                {
                    var requirement = positionRequirements.FirstOrDefault(pr => pr.CompetencyID == cs.CompetencyID);
                    return requirement != null && cs.CurrentLevel < requirement.RequiredLevel;
                });

                // Get the employee's manager from employee's ManagerID
                var employee = assessment.Employee;
                var managerId = employee?.ManagerID;
                Employee manager = null;
                if (managerId.HasValue)
                {
                    manager = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeID == managerId.Value);
                }
                var managerName = manager?.FullName ?? "Manager";
                var managerEmail = manager?.Email ?? string.Empty;

                // Send notification
                var success = await _notificationService.SendAssessmentCompletionNotificationAsync(
                    employeeName: assessment.Employee?.FullName ?? "Unknown Employee",
                    managerEmail: managerEmail,
                    managerName: managerName,
                    positionTitle: assessment.Employee?.Position?.PositionTitle ?? "Unknown Position",
                    departmentName: assessment.Employee?.Position?.DepartmentNavigation?.DepartmentName ?? "Unknown Department",
                    assessmentPeriod: assessment.AssessmentPeriod,
                    completionDate: DateTime.Now,
                    totalCompetencies: totalCompetencies,
                    averageScore: averageScore,
                    competenciesNeedingAttention: competenciesNeedingAttention
                );

                // Activate manager assessment if this is a self assessment
                if (assessment.AssessmentType == "Self")
                {
                    try
                    {
                        // Find the related manager assessment
                        var managerAssessment = await _context.Assessments
                            .Where(a => a.RelatedAssessmentID == assessment.AssessmentID && 
                                      a.AssessmentType == "Manager" && 
                                      a.IsActive)
                            .FirstOrDefaultAsync();

                        if (managerAssessment != null)
                        {
                            managerAssessment.Status = "In Progress";
                            managerAssessment.ModifiedDate = DateTime.Now;
                            await _context.SaveChangesAsync();
                            Console.WriteLine($"Manager assessment {managerAssessment.AssessmentID} activated to 'In Progress'");
                        }
                        else
                        {
                            Console.WriteLine($"No manager assessment found for self assessment {assessment.AssessmentID}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error activating manager assessment: {ex.Message}");
                    }
                }

                if (success)
                {
                    return Ok(new { message = "Notification sent successfully and manager assessment activated", success = true });
                }
                else
                {
                    return BadRequest(new { message = "Failed to send notification", success = false });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error sending notification: {ex.Message}", success = false });
            }
        }
    }

    public class SendNotificationRequest
    {
        public string ManagerEmail { get; set; } = string.Empty;
    }
} 