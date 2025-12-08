using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using System.Security.Claims;

namespace Career_Management.Server.Controllers
{
    /// <summary>
    /// Base controller with authentication helpers for extracting user information from JWT claims
    /// </summary>
    [Authorize]
    [ApiController]
    public class BaseAuthController : ControllerBase
    {
        /// <summary>
        /// Get the current authenticated user's ID from JWT claims
        /// For custom JWT tokens, it extracts userId directly
        /// For Okta tokens, it looks up the user by email
        /// </summary>
        /// <returns>User ID if authenticated, null otherwise</returns>
        protected async Task<int?> GetCurrentUserIdAsync()
        {
            try
            {
                // First, try to get userId from custom JWT token
                var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    return await Task.FromResult(userId);
                }
                
                // If no userId claim, this might be an Okta token
                // Try to get email and look up user in database
                var emailClaim = User.FindFirst(ClaimTypes.Email) ?? User.FindFirst("email");
                if (emailClaim != null && !string.IsNullOrEmpty(emailClaim.Value))
                {
                    // Get DbContext from HttpContext
                    var dbContext = HttpContext.RequestServices.GetService(typeof(CareerManagementContext)) as CareerManagementContext;
                    if (dbContext != null)
                    {
                        var email = emailClaim.Value.ToLower().Trim();
                        var employee = await dbContext.Employees
                            .FirstOrDefaultAsync(e => e.Email != null && e.Email.ToLower().Trim() == email && e.IsActive);
                        
                        if (employee != null)
                        {
                            var user = await dbContext.Users
                                .FirstOrDefaultAsync(u => u.EmployeeID == employee.EmployeeID && u.IsActive);
                            
                            if (user != null)
                            {
                                return user.UserID;
                            }
                        }
                    }
                }
                
                return null;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Get the current authenticated user's employee ID from JWT claims
        /// </summary>
        /// <returns>Employee ID if found, null otherwise</returns>
        protected async Task<int?> GetCurrentEmployeeIdAsync()
        {
            try
            {
                var employeeIdClaim = User.FindFirst("employeeId");
                
                if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId))
                {
                    return await Task.FromResult(employeeId);
                }
                
                return null;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Get the current authenticated user's email from JWT claims
        /// </summary>
        /// <returns>Email if found, null otherwise</returns>
        protected async Task<string?> GetCurrentUserEmailAsync()
        {
            try
            {
                var emailClaim = User.FindFirst(ClaimTypes.Email) ?? User.FindFirst("email");
                return await Task.FromResult(emailClaim?.Value);
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Check if the current user is a system administrator
        /// </summary>
        /// <returns>True if system admin, false otherwise</returns>
        protected async Task<bool> IsSystemAdminAsync()
        {
            try
            {
                var isAdminClaim = User.FindFirst("isSystemAdmin");
                
                if (isAdminClaim != null && bool.TryParse(isAdminClaim.Value, out bool isAdmin))
                {
                    return await Task.FromResult(isAdmin);
                }
                
                return false;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Get the current authenticated user's ID (synchronous version)
        /// </summary>
        /// <returns>User ID if authenticated, null otherwise</returns>
        protected int? GetCurrentUserId()
        {
            try
            {
                var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
                
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    return userId;
                }
                
                return null;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Get the current authenticated user's employee ID (synchronous version)
        /// </summary>
        /// <returns>Employee ID if found, null otherwise</returns>
        protected int? GetCurrentEmployeeId()
        {
            try
            {
                var employeeIdClaim = User.FindFirst("employeeId");
                
                if (employeeIdClaim != null && int.TryParse(employeeIdClaim.Value, out int employeeId))
                {
                    return employeeId;
                }
                
                return null;
            }
            catch
            {
                return null;
            }
        }
    }
}

