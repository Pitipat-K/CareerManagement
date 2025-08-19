using Microsoft.AspNetCore.Mvc;
using Career_Management.Server.Services;
using Career_Management.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestNotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;
        private readonly CareerManagementContext _context;

        public TestNotificationController(NotificationService notificationService, CareerManagementContext context)
        {
            _notificationService = notificationService;
            _context = context;
        }

        // POST: api/TestNotification/send-test-email
        [HttpPost("send-test-email")]
        public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(request.ManagerEmail))
                {
                    return BadRequest(new { message = "Manager email is required", success = false });
                }

                // Validate email format
                if (!IsValidEmail(request.ManagerEmail))
                {
                    return BadRequest(new { message = "Invalid email format", success = false });
                }

                var success = await _notificationService.SendAssessmentCompletionNotificationAsync(
                    employeeName: request.EmployeeName ?? "Test Employee",
                    managerEmail: request.ManagerEmail,
                    managerName: request.ManagerName ?? "Test Manager",
                    positionTitle: request.PositionTitle ?? "Test Position",
                    departmentName: request.DepartmentName ?? "Test Department",
                    assessmentPeriod: request.AssessmentPeriod ?? "Q1 2025",
                    completionDate: request.CompletionDate ?? DateTime.Now,
                    totalCompetencies: request.TotalCompetencies ?? 10,
                    averageScore: request.AverageScore ?? 3.5,
                    competenciesNeedingAttention: request.CompetenciesNeedingAttention ?? 2
                );

                if (success)
                {
                    return Ok(new { message = "Test email sent successfully", success = true });
                }
                else
                {
                    return BadRequest(new { message = "Failed to send test email", success = false });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error sending test email: {ex.Message}", success = false });
            }
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // GET: api/TestNotification/test-config
        [HttpGet("test-config")]
        public async Task<IActionResult> TestConfiguration()
        {
            try
            {
                // Test if configuration files exist and can be loaded
                var tokenConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "Config", "send-email-token.json");
                var notificationConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "Config", "assessment-notification-config.json");

                var result = new
                {
                    tokenConfigExists = System.IO.File.Exists(tokenConfigPath),
                    notificationConfigExists = System.IO.File.Exists(notificationConfigPath),
                    tokenConfigPath = tokenConfigPath,
                    notificationConfigPath = notificationConfigPath,
                    currentDirectory = Directory.GetCurrentDirectory()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error testing configuration: {ex.Message}" });
            }
        }

        // GET: api/TestNotification/test-notification-service
        [HttpGet("test-notification-service")]
        public async Task<IActionResult> TestNotificationService()
        {
            try
            {
                // Test the notification service configuration loading
                var testEmail = "test@example.com";
                var testEmployeeName = "Test Employee";
                var testPositionTitle = "Test Position";
                var testDepartmentName = "Test Department";
                var testAssessmentPeriod = "Q1 2025";
                var testCompletionDate = DateTime.Now;
                var testTotalCompetencies = 10;
                var testAverageScore = 3.5;
                var testCompetenciesNeedingAttention = 2;

                var success = await _notificationService.SendAssessmentCompletionNotificationAsync(
                    testEmployeeName,
                    testEmail,
                    "Test Manager",
                    testPositionTitle,
                    testDepartmentName,
                    testAssessmentPeriod,
                    testCompletionDate,
                    testTotalCompetencies,
                    testAverageScore,
                    testCompetenciesNeedingAttention
                );

                return Ok(new { 
                    success = success, 
                    message = success ? "Notification service test successful" : "Notification service test failed",
                    testData = new
                    {
                        email = testEmail,
                        employeeName = testEmployeeName,
                        positionTitle = testPositionTitle,
                        departmentName = testDepartmentName,
                        assessmentPeriod = testAssessmentPeriod,
                        completionDate = testCompletionDate,
                        totalCompetencies = testTotalCompetencies,
                        averageScore = testAverageScore,
                        competenciesNeedingAttention = testCompetenciesNeedingAttention
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error testing notification service: {ex.Message}", stackTrace = ex.StackTrace });
            }
        }

        // GET: api/TestNotification/employees-with-managers
        [HttpGet("employees-with-managers")]
        public async Task<IActionResult> GetEmployeesWithManagers()
        {
            try
            {
                var employees = await _context.Employees
                    .Include(e => e.Position)
                        .ThenInclude(p => p.DepartmentNavigation)
                    .Where(e => e.IsActive && e.Email != null)
                    .Select(e => new
                    {
                        EmployeeID = e.EmployeeID,
                        EmployeeName = e.FullName,
                        EmployeeEmail = e.Email,
                        PositionTitle = e.Position != null ? e.Position.PositionTitle : "Unknown",
                        DepartmentName = e.Position != null && e.Position.DepartmentNavigation != null ? e.Position.DepartmentNavigation.DepartmentName : "Unknown",
                        ManagerID = e.ManagerID,
                        HasManager = e.ManagerID != null
                    })
                    .ToListAsync();

                return Ok(employees);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error getting employees: {ex.Message}" });
            }
        }

        // GET: api/TestNotification/managers
        [HttpGet("managers")]
        public async Task<IActionResult> GetManagers()
        {
            try
            {
                var managers = await _context.Employees
                    .Where(e => e.IsActive && e.Email != null)
                    .Select(e => new
                    {
                        EmployeeID = e.EmployeeID,
                        EmployeeName = e.FullName,
                        Email = e.Email,
                        PositionTitle = e.Position != null ? e.Position.PositionTitle : "Unknown"
                    })
                    .ToListAsync();

                return Ok(managers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error getting managers: {ex.Message}" });
            }
        }
    }

    public class TestEmailRequest
    {
        public string? EmployeeName { get; set; }
        public string? ManagerEmail { get; set; }
        public string? ManagerName { get; set; }
        public string? PositionTitle { get; set; }
        public string? DepartmentName { get; set; }
        public string? AssessmentPeriod { get; set; }
        public DateTime? CompletionDate { get; set; }
        public int? TotalCompetencies { get; set; }
        public double? AverageScore { get; set; }
        public int? CompetenciesNeedingAttention { get; set; }
    }
} 