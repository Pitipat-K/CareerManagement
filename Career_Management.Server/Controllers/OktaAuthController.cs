using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OktaAuthController : ControllerBase
    {
        private readonly ILogger<OktaAuthController> _logger;

        public OktaAuthController(ILogger<OktaAuthController> logger)
        {
            _logger = logger;
        }

        [HttpPost("validate-user")]
        public async Task<IActionResult> ValidateUser([FromBody] UserValidationRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    _logger.LogWarning("User email is missing");
                    return BadRequest(new { error = "email_required", message = "User email is required" });
                }

                _logger.LogInformation("Validating user with email: {Email}", request.Email);

                // Here you can add any additional server-side user validation logic
                // For example, checking if user exists in your database, has proper permissions, etc.
                
                return Ok(new
                {
                    success = true,
                    message = "User validated successfully",
                    email = request.Email
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user validation");
                return StatusCode(500, new { error = "internal_error", message = "An internal error occurred during user validation" });
            }
        }
    }

    public class UserValidationRequest
    {
        public string? Email { get; set; }
        public string? Name { get; set; }
    }
}
