using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Services;
using System.Security.Cryptography;
using System.Text;

namespace Career_Management.Server.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly CareerManagementContext _context;
        private readonly ILogger<AuthenticationController> _logger;
        private readonly IEmailService _emailService;
        private readonly IJwtTokenService _jwtTokenService;
        private const int MaxLoginAttempts = 5;
        private const int LockoutMinutes = 30;
        private const int VerificationCodeExpiryMinutes = 15;

        public AuthenticationController(
            CareerManagementContext context, 
            ILogger<AuthenticationController> logger,
            IEmailService emailService,
            IJwtTokenService jwtTokenService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
            _jwtTokenService = jwtTokenService;
        }

        /// <summary>
        /// Step 1: Verify employee code exists and return employee info
        /// </summary>
        [HttpPost("verify-employee-code")]
        public async Task<IActionResult> VerifyEmployeeCode([FromBody] VerifyEmployeeCodeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.EmployeeCode))
                {
                    return BadRequest(new { success = false, message = "Employee code is required" });
                }

                _logger.LogInformation("Verifying employee code: {EmployeeCode}", request.EmployeeCode);

                // Find employee by employee code
                var employee = await _context.Employees
                    .Include(e => e.Position)
                    .FirstOrDefaultAsync(e => 
                        e.EmployeeCode != null && 
                        e.EmployeeCode.Trim().ToLower() == request.EmployeeCode.Trim().ToLower() &&
                        e.IsActive);

                if (employee == null)
                {
                    _logger.LogWarning("Employee code not found: {EmployeeCode}", request.EmployeeCode);
                    return NotFound(new { success = false, message = "Employee code not found" });
                }

                // Check if user account exists for this employee
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmployeeID == employee.EmployeeID && u.IsActive);

                if (user == null)
                {
                    _logger.LogWarning("No user account found for employee: {EmployeeID}", employee.EmployeeID);
                    return NotFound(new { success = false, message = "No user account found for this employee. Please contact HR." });
                }

                // Check if account is locked
                if (user.IsLocked)
                {
                    if (user.LockoutEndDate.HasValue && user.LockoutEndDate > DateTime.UtcNow)
                    {
                        var remainingMinutes = (int)(user.LockoutEndDate.Value - DateTime.UtcNow).TotalMinutes;
                        return BadRequest(new { 
                            success = false, 
                            message = $"Account is locked due to multiple failed login attempts. Please try again in {remainingMinutes} minutes.",
                            isLocked = true,
                            lockoutEndDate = user.LockoutEndDate
                        });
                    }
                    else
                    {
                        // Lockout period expired, unlock account
                        user.IsLocked = false;
                        user.LockoutEndDate = null;
                        user.LoginAttempts = 0;
                        await _context.SaveChangesAsync();
                    }
                }

                // Check if password is set
                if (string.IsNullOrEmpty(user.PasswordHash))
                {
                    _logger.LogWarning("User {UserID} does not have a password set", user.UserID);
                    return BadRequest(new { 
                        success = false, 
                        message = "Your account does not have a password set. Please contact IT support to set up your password.",
                        requirePasswordSetup = true
                    });
                }

                // Return employee info (for display purposes)
                return Ok(new
                {
                    success = true,
                    employeeID = employee.EmployeeID,
                    employeeCode = employee.EmployeeCode,
                    firstName = employee.FirstName,
                    lastName = employee.LastName,
                    email = employee.Email,
                    positionTitle = employee.Position?.PositionTitle,
                    requirePasswordChange = user.RequirePasswordChange
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying employee code");
                return StatusCode(500, new { success = false, message = "An error occurred while verifying employee code" });
            }
        }

        /// <summary>
        /// Step 2: Login with email and password
        /// </summary>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new { success = false, message = "Email and password are required" });
                }

                _logger.LogInformation("Login attempt for email: {Email}", request.Email);

                // Find employee by email
                var employee = await _context.Employees
                    .Include(e => e.Position)
                    .ThenInclude(p => p.DepartmentNavigation)
                    .FirstOrDefaultAsync(e => 
                        e.Email != null && 
                        e.Email.Trim().ToLower() == request.Email.Trim().ToLower() &&
                        e.IsActive);

                if (employee == null)
                {
                    _logger.LogWarning("Email not found: {Email}", request.Email);
                    // Don't reveal whether email exists or not for security
                    return Unauthorized(new { success = false, message = "Invalid email or password" });
                }

                // Get user account
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmployeeID == employee.EmployeeID && u.IsActive);

                if (user == null)
                {
                    _logger.LogWarning("No user account found for employee email: {Email}", request.Email);
                    return Unauthorized(new { success = false, message = "Invalid email or password" });
                }

                // Check if account is locked
                if (user.IsLocked)
                {
                    if (user.LockoutEndDate.HasValue && user.LockoutEndDate > DateTime.UtcNow)
                    {
                        var remainingMinutes = (int)(user.LockoutEndDate.Value - DateTime.UtcNow).TotalMinutes;
                        return BadRequest(new { 
                            success = false, 
                            message = $"Account is locked. Please try again in {remainingMinutes} minutes.",
                            isLocked = true
                        });
                    }
                    else
                    {
                        // Lockout expired
                        user.IsLocked = false;
                        user.LockoutEndDate = null;
                        user.LoginAttempts = 0;
                    }
                }

                // Verify password
                if (string.IsNullOrEmpty(user.PasswordHash))
                {
                    _logger.LogWarning("User {UserID} does not have a password set", user.UserID);
                    return BadRequest(new { success = false, message = "Account password not set. Please contact IT support." });
                }

                bool isPasswordValid = VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt);

                if (!isPasswordValid)
                {
                    _logger.LogWarning("Invalid password for user: {UserID}", user.UserID);
                    
                    // Increment login attempts
                    user.LoginAttempts++;
                    
                    if (user.LoginAttempts >= MaxLoginAttempts)
                    {
                        user.IsLocked = true;
                        user.LockoutEndDate = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                        await _context.SaveChangesAsync();
                        
                        _logger.LogWarning("User account locked due to multiple failed attempts: {UserID}", user.UserID);
                        return BadRequest(new { 
                            success = false, 
                            message = $"Account locked due to multiple failed login attempts. Please try again in {LockoutMinutes} minutes.",
                            isLocked = true
                        });
                    }
                    
                    await _context.SaveChangesAsync();
                    
                    var attemptsRemaining = MaxLoginAttempts - user.LoginAttempts;
                    return Unauthorized(new { 
                        success = false, 
                        message = $"Invalid email or password. {attemptsRemaining} attempt(s) remaining.",
                        attemptsRemaining = attemptsRemaining
                    });
                }

                // Login successful - reset login attempts and update last login
                user.LoginAttempts = 0;
                user.LastLoginDate = DateTime.UtcNow;
                user.IsLocked = false;
                user.LockoutEndDate = null;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Login successful for user: {UserID}", user.UserID);

                // Generate JWT token
                var token = _jwtTokenService.GenerateToken(
                    user.UserID,
                    employee.EmployeeID,
                    employee.Email,
                    user.IsSystemAdmin
                );

                // Return employee and user info with JWT token
                return Ok(new
                {
                    success = true,
                    message = "Login successful",
                    token = token,
                    user = new
                    {
                        userID = user.UserID,
                        employeeID = employee.EmployeeID,
                        employeeCode = employee.EmployeeCode,
                        firstName = employee.FirstName,
                        lastName = employee.LastName,
                        email = employee.Email,
                        phone = employee.Phone,
                        positionID = employee.PositionID,
                        positionTitle = employee.Position?.PositionTitle,
                        departmentName = employee.Position?.DepartmentNavigation?.DepartmentName,
                        isSystemAdmin = user.IsSystemAdmin,
                        requirePasswordChange = user.RequirePasswordChange
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { success = false, message = "An error occurred during login" });
            }
        }

        /// <summary>
        /// Initiate password reset - verify employee code and email, send verification code
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.EmployeeCode) || string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest(new { success = false, message = "Employee code and email are required" });
                }

                _logger.LogInformation("Password reset requested for employee code: {EmployeeCode}", request.EmployeeCode);

                // Find employee by employee code and email
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => 
                        e.EmployeeCode != null && 
                        e.EmployeeCode.Trim().ToLower() == request.EmployeeCode.Trim().ToLower() &&
                        e.Email != null &&
                        e.Email.Trim().ToLower() == request.Email.Trim().ToLower() &&
                        e.IsActive);

                if (employee == null)
                {
                    _logger.LogWarning("Invalid employee code or email for password reset");
                    // Don't reveal whether employee exists or not for security
                    return NotFound(new { success = false, message = "Invalid employee code or email" });
                }

                // Check if user exists
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmployeeID == employee.EmployeeID && u.IsActive);

                if (user == null)
                {
                    _logger.LogWarning("No user account found for employee: {EmployeeID}", employee.EmployeeID);
                    return NotFound(new { success = false, message = "No user account found. Please contact HR." });
                }

                // Check if account is locked
                if (user.IsLocked)
                {
                    if (user.LockoutEndDate.HasValue && user.LockoutEndDate > DateTime.UtcNow)
                    {
                        return BadRequest(new { 
                            success = false, 
                            message = "Account is currently locked. Please try again later or contact IT support.",
                            isLocked = true
                        });
                    }
                    else
                    {
                        // Lockout expired, unlock account
                        user.IsLocked = false;
                        user.LockoutEndDate = null;
                        user.LoginAttempts = 0;
                        await _context.SaveChangesAsync();
                    }
                }

                // Generate 6-digit verification code
                var verificationCode = GenerateVerificationCode();

                // Invalidate any existing verification codes for this employee
                var existingCodes = await _context.PasswordResetVerifications
                    .Where(v => v.EmployeeID == employee.EmployeeID && v.IsActive && !v.IsUsed)
                    .ToListAsync();

                foreach (var code in existingCodes)
                {
                    code.IsActive = false;
                }

                // Create new verification record
                var verification = new PasswordResetVerification
                {
                    EmployeeID = employee.EmployeeID,
                    VerificationCode = verificationCode,
                    Email = employee.Email,
                    ExpiryDate = DateTime.UtcNow.AddMinutes(VerificationCodeExpiryMinutes),
                    IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    IsActive = true,
                    IsUsed = false
                };

                _context.PasswordResetVerifications.Add(verification);
                await _context.SaveChangesAsync();

                // Send verification code via email
                var emailSent = await _emailService.SendVerificationCodeAsync(
                    employee.Email,
                    $"{employee.FirstName} {employee.LastName}",
                    verificationCode
                );

                if (!emailSent)
                {
                    _logger.LogWarning("Failed to send verification email to {Email}", employee.Email);
                    // Continue anyway - in development, the email service logs the code
                }

                // Return success (don't reveal employee details yet)
                return Ok(new
                {
                    success = true,
                    message = "A verification code has been sent to your email address. Please check your inbox.",
                    expiryMinutes = VerificationCodeExpiryMinutes,
                    // For development/testing only - remove in production
                    devCode = _context.Database.GetDbConnection().Database.Contains("Dev") ? verificationCode : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset request");
                return StatusCode(500, new { success = false, message = "An error occurred during password reset request" });
            }
        }

        /// <summary>
        /// Verify the code sent to email
        /// </summary>
        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.VerificationCode))
                {
                    return BadRequest(new { success = false, message = "Email and verification code are required" });
                }

                _logger.LogInformation("Verifying code for email: {Email}", request.Email);

                // Find valid verification code
                var verification = await _context.PasswordResetVerifications
                    .Include(v => v.Employee)
                    .FirstOrDefaultAsync(v =>
                        v.Email.ToLower() == request.Email.Trim().ToLower() &&
                        v.VerificationCode == request.VerificationCode.Trim() &&
                        v.IsActive &&
                        !v.IsUsed &&
                        v.ExpiryDate > DateTime.UtcNow);

                if (verification == null)
                {
                    _logger.LogWarning("Invalid or expired verification code for {Email}", request.Email);
                    return Unauthorized(new { success = false, message = "Invalid or expired verification code" });
                }

                // Mark as used
                verification.IsUsed = true;
                verification.UsedDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Return employee info to proceed to password reset
                return Ok(new
                {
                    success = true,
                    message = "Verification successful. You can now reset your password.",
                    employeeID = verification.Employee.EmployeeID,
                    employeeCode = verification.Employee.EmployeeCode,
                    firstName = verification.Employee.FirstName,
                    lastName = verification.Employee.LastName,
                    email = verification.Email
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying code");
                return StatusCode(500, new { success = false, message = "An error occurred during verification" });
            }
        }

        /// <summary>
        /// Reset password for a user (after verification)
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                if (request.EmployeeID <= 0 || string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(new { success = false, message = "Employee ID and new password are required" });
                }

                // Password strength validation
                if (request.NewPassword.Length < 8)
                {
                    return BadRequest(new { success = false, message = "Password must be at least 8 characters long" });
                }

                // Verify employee code and email match (security check)
                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => 
                        e.EmployeeID == request.EmployeeID &&
                        e.EmployeeCode != null &&
                        e.EmployeeCode.Trim().ToLower() == request.EmployeeCode.Trim().ToLower() &&
                        e.Email != null &&
                        e.Email.Trim().ToLower() == request.Email.Trim().ToLower() &&
                        e.IsActive);

                if (employee == null)
                {
                    _logger.LogWarning("Invalid employee verification during password reset");
                    return BadRequest(new { success = false, message = "Invalid verification. Please start over." });
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmployeeID == request.EmployeeID && u.IsActive);

                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                // Generate salt and hash password
                var (hash, salt) = HashPassword(request.NewPassword);
                
                user.PasswordHash = hash;
                user.PasswordSalt = salt;
                user.PasswordChangedDate = DateTime.UtcNow;
                user.RequirePasswordChange = false;
                user.ModifiedDate = DateTime.UtcNow;
                
                // Reset lockout and login attempts
                user.IsLocked = false;
                user.LockoutEndDate = null;
                user.LoginAttempts = 0;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Password reset successfully for user: {UserID}", user.UserID);

                // Send confirmation email
                await _emailService.SendPasswordResetConfirmationAsync(
                    employee.Email,
                    $"{employee.FirstName} {employee.LastName}"
                );

                return Ok(new { success = true, message = "Password reset successfully. You can now login with your new password." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password");
                return StatusCode(500, new { success = false, message = "An error occurred while resetting password" });
            }
        }

        /// <summary>
        /// Set or change password for a user
        /// </summary>
        [HttpPost("set-password")]
        public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest request)
        {
            try
            {
                if (request.EmployeeID <= 0 || string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(new { success = false, message = "Employee ID and new password are required" });
                }

                // Password strength validation
                if (request.NewPassword.Length < 8)
                {
                    return BadRequest(new { success = false, message = "Password must be at least 8 characters long" });
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmployeeID == request.EmployeeID && u.IsActive);

                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                // If user has existing password, require old password
                if (!string.IsNullOrEmpty(user.PasswordHash) && string.IsNullOrWhiteSpace(request.OldPassword))
                {
                    return BadRequest(new { success = false, message = "Current password is required" });
                }

                // Verify old password if provided
                if (!string.IsNullOrEmpty(user.PasswordHash))
                {
                    bool isOldPasswordValid = VerifyPassword(request.OldPassword ?? "", user.PasswordHash, user.PasswordSalt);
                    if (!isOldPasswordValid)
                    {
                        return Unauthorized(new { success = false, message = "Current password is incorrect" });
                    }
                }

                // Generate salt and hash password
                var (hash, salt) = HashPassword(request.NewPassword);
                
                user.PasswordHash = hash;
                user.PasswordSalt = salt;
                user.PasswordChangedDate = DateTime.UtcNow;
                user.RequirePasswordChange = false;
                user.ModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Password set/changed for user: {UserID}", user.UserID);

                return Ok(new { success = true, message = "Password updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting password");
                return StatusCode(500, new { success = false, message = "An error occurred while setting password" });
            }
        }

        #region Helper Methods

        /// <summary>
        /// Generate a 6-digit verification code
        /// </summary>
        private string GenerateVerificationCode()
        {
            using (var rng = RandomNumberGenerator.Create())
            {
                byte[] randomBytes = new byte[4];
                rng.GetBytes(randomBytes);
                int randomNumber = Math.Abs(BitConverter.ToInt32(randomBytes, 0));
                return (randomNumber % 1000000).ToString("D6");
            }
        }

        #endregion

        #region Password Hashing Helpers

        /// <summary>
        /// Hash a password with salt using SHA256
        /// </summary>
        private (string hash, string salt) HashPassword(string password)
        {
            // Generate a random salt
            byte[] saltBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(saltBytes);
            }
            string salt = Convert.ToBase64String(saltBytes);

            // Hash password with salt
            string hash = HashPasswordWithSalt(password, salt);

            return (hash, salt);
        }

        /// <summary>
        /// Hash password with provided salt
        /// </summary>
        private string HashPasswordWithSalt(string password, string salt)
        {
            using (var sha256 = SHA256.Create())
            {
                // Combine password and salt
                string saltedPassword = password + salt;
                byte[] saltedPasswordBytes = Encoding.UTF8.GetBytes(saltedPassword);
                
                // Hash the combined string
                byte[] hashBytes = sha256.ComputeHash(saltedPasswordBytes);
                
                // Convert to base64 string
                return Convert.ToBase64String(hashBytes);
            }
        }

        /// <summary>
        /// Verify password against stored hash
        /// </summary>
        private bool VerifyPassword(string password, string storedHash, string? storedSalt)
        {
            if (string.IsNullOrEmpty(storedHash))
                return false;

            // If no salt stored (legacy), hash without salt
            string salt = storedSalt ?? string.Empty;
            
            string hash = HashPasswordWithSalt(password, salt);
            
            return hash == storedHash;
        }

        #endregion

        #region Request Models

        public class VerifyEmployeeCodeRequest
        {
            public string EmployeeCode { get; set; } = string.Empty;
        }

        public class LoginRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class SetPasswordRequest
        {
            public int EmployeeID { get; set; }
            public string? OldPassword { get; set; }
            public string NewPassword { get; set; } = string.Empty;
        }

        public class ForgotPasswordRequest
        {
            public string EmployeeCode { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
        }

        public class VerifyCodeRequest
        {
            public string Email { get; set; } = string.Empty;
            public string VerificationCode { get; set; } = string.Empty;
        }

        public class ResetPasswordRequest
        {
            public int EmployeeID { get; set; }
            public string EmployeeCode { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        #endregion
    }
}

