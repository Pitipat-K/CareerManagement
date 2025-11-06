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
    public class UsersController : ControllerBase
    {
        private readonly CareerManagementContext _context;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(CareerManagementContext context, IPermissionService permissionService, ILogger<UsersController> logger)
        {
            _context = context;
            _permissionService = permissionService;
            _logger = logger;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Include(u => u.Employee)
                    .ThenInclude(e => e.Position)
                    .ThenInclude(p => p.DepartmentNavigation)
                    .Include(u => u.UserRoles.Where(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)))
                    .ThenInclude(ur => ur.Role)
                    .Where(u => u.IsActive)
                    .Select(u => new UserDto
                    {
                        UserID = u.UserID,
                        EmployeeID = u.EmployeeID,
                        Username = u.Username,
                        IsSystemAdmin = u.IsSystemAdmin,
                        LastLoginDate = u.LastLoginDate,
                        LoginAttempts = u.LoginAttempts,
                        IsLocked = u.IsLocked,
                        LockoutEndDate = u.LockoutEndDate,
                        CreatedDate = u.CreatedDate,
                        IsActive = u.IsActive,
                        EmployeeFullName = u.Employee.FirstName + " " + u.Employee.LastName,
                        EmployeeEmail = u.Employee.Email,
                        DepartmentName = u.Employee.Position.DepartmentNavigation != null ? u.Employee.Position.DepartmentNavigation.DepartmentName : null,
                        PositionTitle = u.Employee.Position.PositionTitle,
                        RoleCount = u.UserRoles.Count(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)),
                        RoleNames = string.Join(", ", u.UserRoles.Where(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)).Select(ur => ur.Role.RoleName)),
                        Roles = u.UserRoles.Where(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)).Select(ur => new UserRoleDto
                        {
                            UserRoleID = ur.UserRoleID,
                            RoleID = ur.RoleID,
                            RoleName = ur.Role.RoleName,
                            RoleCode = ur.Role.RoleCode,
                            AssignedDate = ur.AssignedDate,
                            ExpiryDate = ur.ExpiryDate,
                            IsActive = ur.IsActive,
                            AssignedByName = ur.AssignedByEmployee != null ? ur.AssignedByEmployee.FirstName + " " + ur.AssignedByEmployee.LastName : null
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Employee)
                    .ThenInclude(e => e.Position)
                    .ThenInclude(p => p.DepartmentNavigation)
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.AssignedByEmployee)
                    .FirstOrDefaultAsync(u => u.UserID == id && u.IsActive);

                if (user == null)
                {
                    return NotFound();
                }

                var userDto = new UserDto
                {
                    UserID = user.UserID,
                    EmployeeID = user.EmployeeID,
                    Username = user.Username,
                    IsSystemAdmin = user.IsSystemAdmin,
                    LastLoginDate = user.LastLoginDate,
                    LoginAttempts = user.LoginAttempts,
                    IsLocked = user.IsLocked,
                    LockoutEndDate = user.LockoutEndDate,
                    CreatedDate = user.CreatedDate,
                    IsActive = user.IsActive,
                    EmployeeFullName = user.Employee.FirstName + " " + user.Employee.LastName,
                    EmployeeEmail = user.Employee.Email,
                    DepartmentName = user.Employee.Position.DepartmentNavigation?.DepartmentName,
                    PositionTitle = user.Employee.Position.PositionTitle,
                    RoleCount = user.UserRoles.Count(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)),
                    RoleNames = string.Join(", ", user.UserRoles.Where(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)).Select(ur => ur.Role.RoleName)),
                    Roles = user.UserRoles.Where(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)).Select(ur => new UserRoleDto
                    {
                        UserRoleID = ur.UserRoleID,
                        RoleID = ur.RoleID,
                        RoleName = ur.Role.RoleName,
                        RoleCode = ur.Role.RoleCode,
                        AssignedDate = ur.AssignedDate,
                        ExpiryDate = ur.ExpiryDate,
                        IsActive = ur.IsActive,
                        AssignedByName = ur.AssignedByEmployee != null ? ur.AssignedByEmployee.FirstName + " " + ur.AssignedByEmployee.LastName : null
                    }).ToList()
                };

                return Ok(userDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user {UserId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Users/employee/5
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<UserDto>> GetUserByEmployeeId(int employeeId)
        {
            try
            {
                var user = await _permissionService.GetUserByEmployeeIdAsync(employeeId);
                if (user == null)
                {
                    return NotFound();
                }

                return await GetUser(user.UserID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user by employee ID {EmployeeId}", employeeId);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Users/username/john.doe@company.com
        [HttpGet("username/{username}")]
        public async Task<ActionResult<UserDto>> GetUserByUsername(string username)
        {
            try
            {
                var user = await _permissionService.GetUserByUsernameAsync(username);
                if (user == null)
                {
                    return NotFound();
                }

                return await GetUser(user.UserID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user by username {Username}", username);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<UserDto>> CreateUser(CreateUserRequest request)
        {
            try
            {
                // Check if employee exists
                var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeID == request.EmployeeID && e.IsActive);
                if (employee == null)
                {
                    return BadRequest("Employee not found or inactive");
                }

                // Check if user already exists for this employee
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeID == request.EmployeeID);
                if (existingUser != null)
                {
                    return BadRequest("User already exists for this employee");
                }

                // Generate username if not provided
                var username = request.Username;
                if (string.IsNullOrEmpty(username))
                {
                    username = !string.IsNullOrEmpty(employee.Email) ? employee.Email : $"employee{request.EmployeeID}@company.com";
                }

                // Check for username uniqueness
                var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                if (existingUsername != null)
                {
                    return BadRequest("Username already exists");
                }

                var user = new User
                {
                    EmployeeID = request.EmployeeID,
                    Username = username,
                    IsSystemAdmin = request.IsSystemAdmin,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Assign default role if not system admin
                if (!request.IsSystemAdmin && !string.IsNullOrEmpty(request.DefaultRoleCode))
                {
                    var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == request.DefaultRoleCode && r.IsActive);
                    if (defaultRole != null)
                    {
                        var userRole = new UserRole
                        {
                            UserID = user.UserID,
                            RoleID = defaultRole.RoleID,
                            AssignedDate = DateTime.UtcNow,
                            AssignedBy = 1, // System assignment
                            IsActive = true
                        };

                        _context.UserRoles.Add(userRole);
                        await _context.SaveChangesAsync();

                        // Log the action
                        await _permissionService.LogPermissionActionAsync(user.UserID, "USER_CREATED", "USER", user.UserID, 
                            null, $"User created from Employee ID: {request.EmployeeID}", "System user creation", 1);
                    }
                }

                return CreatedAtAction(nameof(GetUser), new { id = user.UserID }, await GetUser(user.UserID));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user for employee {EmployeeId}", request.EmployeeID);
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id && u.IsActive);
                if (user == null)
                {
                    return NotFound();
                }

                var oldValues = new List<string>();
                var newValues = new List<string>();

                if (request.Username != null && request.Username != user.Username)
                {
                    // Check for username uniqueness
                    var existingUsername = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username && u.UserID != id);
                    if (existingUsername != null)
                    {
                        return BadRequest("Username already exists");
                    }
                    oldValues.Add($"Username: {user.Username}");
                    newValues.Add($"Username: {request.Username}");
                    user.Username = request.Username;
                }

                if (request.IsSystemAdmin.HasValue && request.IsSystemAdmin != user.IsSystemAdmin)
                {
                    oldValues.Add($"IsSystemAdmin: {user.IsSystemAdmin}");
                    newValues.Add($"IsSystemAdmin: {request.IsSystemAdmin}");
                    user.IsSystemAdmin = request.IsSystemAdmin.Value;
                }

                if (request.IsActive.HasValue && request.IsActive != user.IsActive)
                {
                    oldValues.Add($"IsActive: {user.IsActive}");
                    newValues.Add($"IsActive: {request.IsActive}");
                    user.IsActive = request.IsActive.Value;
                }

                if (request.IsLocked.HasValue && request.IsLocked != user.IsLocked)
                {
                    oldValues.Add($"IsLocked: {user.IsLocked}");
                    newValues.Add($"IsLocked: {request.IsLocked}");
                    user.IsLocked = request.IsLocked.Value;
                    
                    if (!request.IsLocked.Value)
                    {
                        user.LoginAttempts = 0;
                        user.LockoutEndDate = null;
                    }
                }

                user.ModifiedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Log the changes
                if (oldValues.Any())
                {
                    await _permissionService.LogPermissionActionAsync(user.UserID, "USER_UPDATED", "USER", user.UserID, 
                        string.Join("; ", oldValues), string.Join("; ", newValues), "User profile updated", 1);
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Users/5/roles
        [HttpPost("{id}/roles")]
        public async Task<IActionResult> AssignRole(int id, AssignRoleRequest request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id && u.IsActive);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleID == request.RoleID && r.IsActive);
                if (role == null)
                {
                    return BadRequest("Role not found or inactive");
                }

                // Check if assignment already exists (including inactive ones)
                var existingAssignment = await _context.UserRoles
                    .FirstOrDefaultAsync(ur => ur.UserID == id && ur.RoleID == request.RoleID);

                if (existingAssignment != null)
                {
                    // If inactive, reactivate it
                    if (!existingAssignment.IsActive)
                    {
                        existingAssignment.IsActive = true;
                        existingAssignment.AssignedDate = DateTime.UtcNow;
                        existingAssignment.AssignedBy = 1; // TODO: Get current user ID
                        existingAssignment.ExpiryDate = request.ExpiryDate;
                        await _context.SaveChangesAsync();

                        await _permissionService.LogPermissionActionAsync(id, "ROLE_REASSIGNED", "ROLE", request.RoleID, 
                            null, role.RoleName, request.Reason, 1);

                        return Ok("Role reassigned successfully");
                    }
                    
                    // If already active, update expiry date if provided
                    if (request.ExpiryDate.HasValue)
                    {
                        existingAssignment.ExpiryDate = request.ExpiryDate;
                        existingAssignment.AssignedDate = DateTime.UtcNow;
                        await _context.SaveChangesAsync();

                        await _permissionService.LogPermissionActionAsync(id, "ROLE_UPDATED", "ROLE", request.RoleID, 
                            null, $"Expiry date updated to {request.ExpiryDate}", request.Reason, 1);
                    }
                    return Ok("Role already assigned");
                }

                var userRole = new UserRole
                {
                    UserID = id,
                    RoleID = request.RoleID,
                    AssignedDate = DateTime.UtcNow,
                    ExpiryDate = request.ExpiryDate,
                    AssignedBy = 1, // TODO: Get current user ID
                    IsActive = true
                };

                _context.UserRoles.Add(userRole);
                await _context.SaveChangesAsync();

                await _permissionService.LogPermissionActionAsync(id, "ROLE_ASSIGNED", "ROLE", request.RoleID, 
                    null, role.RoleName, request.Reason, 1);

                return Ok("Role assigned successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning role {RoleId} to user {UserId}", request.RoleID, id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Users/5/roles/3
        [HttpDelete("{id}/roles/{roleId}")]
        public async Task<IActionResult> RemoveRole(int id, int roleId, [FromQuery] string? reason = null)
        {
            try
            {
                var userRole = await _context.UserRoles
                    .Include(ur => ur.Role)
                    .FirstOrDefaultAsync(ur => ur.UserID == id && ur.RoleID == roleId && ur.IsActive);

                if (userRole == null)
                {
                    return NotFound("Role assignment not found");
                }

                userRole.IsActive = false;
                await _context.SaveChangesAsync();

                await _permissionService.LogPermissionActionAsync(id, "ROLE_REMOVED", "ROLE", roleId, 
                    userRole.Role.RoleName, null, reason, 1);

                return Ok("Role removed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing role {RoleId} from user {UserId}", roleId, id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Users/5/permissions
        [HttpGet("{id}/permissions")]
        public async Task<ActionResult<IEnumerable<UserPermissionDto>>> GetUserPermissions(int id)
        {
            try
            {
                var permissions = await _permissionService.GetUserPermissionsAsync(id);
                return Ok(permissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permissions for user {UserId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Users/check-permission
        [HttpPost("check-permission")]
        public async Task<ActionResult<PermissionCheckResponse>> CheckPermission(PermissionCheckRequest request)
        {
            try
            {
                var result = await _permissionService.CheckPermissionAsync(request.UserID, request.ModuleCode, request.PermissionCode);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission for user {UserId}", request.UserID);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == id);
                if (user == null)
                {
                    return NotFound();
                }

                // Soft delete
                user.IsActive = false;
                user.ModifiedDate = DateTime.UtcNow;

                // Deactivate all user roles
                var userRoles = await _context.UserRoles.Where(ur => ur.UserID == id && ur.IsActive).ToListAsync();
                foreach (var userRole in userRoles)
                {
                    userRole.IsActive = false;
                }

                await _context.SaveChangesAsync();

                await _permissionService.LogPermissionActionAsync(id, "USER_DELETED", "USER", id, 
                    "Active", "Inactive", "User account deleted", 1);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
