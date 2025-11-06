using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;

namespace Career_Management.Server.Services
{
    public interface IPermissionService
    {
        Task<bool> HasPermissionAsync(int userId, string moduleCode, string permissionCode);
        Task<PermissionCheckResponse> CheckPermissionAsync(int userId, string moduleCode, string permissionCode);
        Task<List<UserPermissionDto>> GetUserPermissionsAsync(int userId);
        Task<User?> GetUserByEmployeeIdAsync(int employeeId);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<bool> IsSystemAdminAsync(int userId);
        Task<List<string>> GetUserRoleCodesAsync(int userId);
        Task LogPermissionActionAsync(int userId, string action, string targetType, int targetId, 
            string? oldValue = null, string? newValue = null, string? reason = null, int? actionBy = null);
    }

    public class PermissionService : IPermissionService
    {
        private readonly CareerManagementContext _context;
        private readonly ILogger<PermissionService> _logger;

        public PermissionService(CareerManagementContext context, ILogger<PermissionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> HasPermissionAsync(int userId, string moduleCode, string permissionCode)
        {
            try
            {
                // Check if user exists and is active
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId && u.IsActive);
                if (user == null) return false;

                // System admins have all permissions
                if (user.IsSystemAdmin) return true;

                // Check for explicit deny override first
                var denyOverride = await _context.UserPermissionOverrides
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .FirstOrDefaultAsync(upo => 
                        upo.UserID == userId && 
                        upo.Permission.Module.ModuleCode == moduleCode && 
                        upo.Permission.PermissionType.PermissionCode == permissionCode &&
                        !upo.IsGranted && 
                        upo.IsActive &&
                        (upo.ExpiryDate == null || upo.ExpiryDate > DateTime.UtcNow));

                if (denyOverride != null) return false;

                // Check for explicit grant override
                var grantOverride = await _context.UserPermissionOverrides
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .FirstOrDefaultAsync(upo => 
                        upo.UserID == userId && 
                        upo.Permission.Module.ModuleCode == moduleCode && 
                        upo.Permission.PermissionType.PermissionCode == permissionCode &&
                        upo.IsGranted && 
                        upo.IsActive &&
                        (upo.ExpiryDate == null || upo.ExpiryDate > DateTime.UtcNow));

                if (grantOverride != null) return true;

                // Check role-based permissions
                var hasRolePermission = await _context.UserRoles
                    .Where(ur => ur.UserID == userId && ur.IsActive && 
                                (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow))
                    .Join(_context.RolePermissions.Where(rp => rp.IsActive),
                        ur => ur.RoleID,
                        rp => rp.RoleID,
                        (ur, rp) => rp)
                    .Join(_context.Permissions.Where(p => p.IsActive),
                        rp => rp.PermissionID,
                        p => p.PermissionID,
                        (rp, p) => p)
                    .Include(p => p.Module)
                    .Include(p => p.PermissionType)
                    .AnyAsync(p => p.Module.ModuleCode == moduleCode && 
                                  p.PermissionType.PermissionCode == permissionCode);

                return hasRolePermission;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking permission for user {UserId}, module {ModuleCode}, permission {PermissionCode}", 
                    userId, moduleCode, permissionCode);
                return false;
            }
        }

        public async Task<PermissionCheckResponse> CheckPermissionAsync(int userId, string moduleCode, string permissionCode)
        {
            var response = new PermissionCheckResponse();
            var sources = new List<string>();

            try
            {
                // Check if user exists and is active
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId && u.IsActive);
                if (user == null)
                {
                    response.HasPermission = false;
                    response.Reason = "User not found or inactive";
                    return response;
                }

                // System admins have all permissions
                if (user.IsSystemAdmin)
                {
                    response.HasPermission = true;
                    response.Reason = "System Administrator";
                    sources.Add("System Admin");
                    response.Sources = sources;
                    return response;
                }

                // Check for explicit deny override first
                var denyOverride = await _context.UserPermissionOverrides
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .FirstOrDefaultAsync(upo => 
                        upo.UserID == userId && 
                        upo.Permission.Module.ModuleCode == moduleCode && 
                        upo.Permission.PermissionType.PermissionCode == permissionCode &&
                        !upo.IsGranted && 
                        upo.IsActive &&
                        (upo.ExpiryDate == null || upo.ExpiryDate > DateTime.UtcNow));

                if (denyOverride != null)
                {
                    response.HasPermission = false;
                    response.Reason = "Explicitly denied by override";
                    sources.Add("Deny Override");
                    response.Sources = sources;
                    return response;
                }

                // Check for explicit grant override
                var grantOverride = await _context.UserPermissionOverrides
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .FirstOrDefaultAsync(upo => 
                        upo.UserID == userId && 
                        upo.Permission.Module.ModuleCode == moduleCode && 
                        upo.Permission.PermissionType.PermissionCode == permissionCode &&
                        upo.IsGranted && 
                        upo.IsActive &&
                        (upo.ExpiryDate == null || upo.ExpiryDate > DateTime.UtcNow));

                if (grantOverride != null)
                {
                    response.HasPermission = true;
                    response.Reason = "Granted by override";
                    sources.Add("Grant Override");
                    response.Sources = sources;
                    return response;
                }

                // Check role-based permissions
                var rolePermissions = await _context.UserRoles
                    .Where(ur => ur.UserID == userId && ur.IsActive && 
                                (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow))
                    .Include(ur => ur.Role)
                    .Join(_context.RolePermissions.Where(rp => rp.IsActive),
                        ur => ur.RoleID,
                        rp => rp.RoleID,
                        (ur, rp) => new { ur.Role, rp })
                    .Join(_context.Permissions.Where(p => p.IsActive),
                        x => x.rp.PermissionID,
                        p => p.PermissionID,
                        (x, p) => new { x.Role, Permission = p })
                    .Include(x => x.Permission.Module)
                    .Include(x => x.Permission.PermissionType)
                    .Where(x => x.Permission.Module.ModuleCode == moduleCode && 
                               x.Permission.PermissionType.PermissionCode == permissionCode)
                    .ToListAsync();

                if (rolePermissions.Any())
                {
                    response.HasPermission = true;
                    response.Reason = "Granted by role(s)";
                    sources.AddRange(rolePermissions.Select(rp => $"Role: {rp.Role.RoleName}"));
                    response.Sources = sources;
                    return response;
                }

                response.HasPermission = false;
                response.Reason = "No permission found";
                response.Sources = sources;
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking detailed permission for user {UserId}, module {ModuleCode}, permission {PermissionCode}", 
                    userId, moduleCode, permissionCode);
                response.HasPermission = false;
                response.Reason = "Error checking permission";
                return response;
            }
        }

        public async Task<List<UserPermissionDto>> GetUserPermissionsAsync(int userId)
        {
            var permissions = new List<UserPermissionDto>();

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId && u.IsActive);
                if (user == null) return permissions;

                var employee = await _context.Employees.FirstOrDefaultAsync(e => e.EmployeeID == user.EmployeeID);
                var userFullName = employee != null ? $"{employee.FirstName} {employee.LastName}" : "Unknown";

                // If system admin, return all permissions
                if (user.IsSystemAdmin)
                {
                    var allPermissions = await _context.Permissions
                        .Include(p => p.Module)
                        .Include(p => p.PermissionType)
                        .Where(p => p.IsActive && p.Module.IsActive && p.PermissionType.IsActive)
                        .Select(p => new UserPermissionDto
                        {
                            UserID = userId,
                            UserFullName = userFullName,
                            ModuleName = p.Module.ModuleName,
                            ModuleCode = p.Module.ModuleCode,
                            PermissionName = p.PermissionType.PermissionName,
                            PermissionCode = p.PermissionType.PermissionCode,
                            PermissionFullName = p.Module.ModuleCode + "_" + p.PermissionType.PermissionCode,
                            RoleName = "System Admin",
                            PermissionSource = "System Admin",
                            IsGranted = true,
                            EffectiveDate = user.CreatedDate
                        })
                        .ToListAsync();

                    return allPermissions;
                }

                // Get role-based permissions
                var rolePermissions = await _context.UserRoles
                    .Where(ur => ur.UserID == userId && ur.IsActive && 
                                (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow))
                    .Include(ur => ur.Role)
                    .SelectMany(ur => ur.Role.RolePermissions
                        .Where(rp => rp.IsActive)
                        .Select(rp => new UserPermissionDto
                        {
                            UserID = userId,
                            UserFullName = userFullName,
                            ModuleName = rp.Permission.Module.ModuleName,
                            ModuleCode = rp.Permission.Module.ModuleCode,
                            PermissionName = rp.Permission.PermissionType.PermissionName,
                            PermissionCode = rp.Permission.PermissionType.PermissionCode,
                            PermissionFullName = rp.Permission.Module.ModuleCode + "_" + rp.Permission.PermissionType.PermissionCode,
                            RoleName = ur.Role.RoleName,
                            PermissionSource = "Role",
                            IsGranted = true,
                            EffectiveDate = ur.AssignedDate,
                            ExpiryDate = ur.ExpiryDate
                        }))
                    .ToListAsync();

                permissions.AddRange(rolePermissions);

                // Get permission overrides
                var overridePermissions = await _context.UserPermissionOverrides
                    .Where(upo => upo.UserID == userId && upo.IsActive &&
                                 (upo.ExpiryDate == null || upo.ExpiryDate > DateTime.UtcNow))
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .Select(upo => new UserPermissionDto
                    {
                        UserID = userId,
                        UserFullName = userFullName,
                        ModuleName = upo.Permission.Module.ModuleName,
                        ModuleCode = upo.Permission.Module.ModuleCode,
                        PermissionName = upo.Permission.PermissionType.PermissionName,
                        PermissionCode = upo.Permission.PermissionType.PermissionCode,
                        PermissionFullName = upo.Permission.Module.ModuleCode + "_" + upo.Permission.PermissionType.PermissionCode,
                        RoleName = "Override",
                        PermissionSource = "Override",
                        IsGranted = upo.IsGranted,
                        EffectiveDate = upo.CreatedDate,
                        ExpiryDate = upo.ExpiryDate
                    })
                    .ToListAsync();

                permissions.AddRange(overridePermissions);

                // Remove duplicates, with overrides taking precedence
                var distinctPermissions = permissions
                    .GroupBy(p => p.PermissionFullName)
                    .Select(g => g.OrderByDescending(p => p.PermissionSource == "Override").First())
                    .ToList();

                return distinctPermissions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting permissions for user {UserId}", userId);
                return permissions;
            }
        }

        public async Task<User?> GetUserByEmployeeIdAsync(int employeeId)
        {
            return await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.EmployeeID == employeeId && u.IsActive);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.Users
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);
        }

        public async Task<bool> IsSystemAdminAsync(int userId)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userId && u.IsActive);
            return user?.IsSystemAdmin == true;
        }

        public async Task<List<string>> GetUserRoleCodesAsync(int userId)
        {
            return await _context.UserRoles
                .Where(ur => ur.UserID == userId && ur.IsActive &&
                            (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow))
                .Include(ur => ur.Role)
                .Select(ur => ur.Role.RoleCode)
                .ToListAsync();
        }

        public async Task LogPermissionActionAsync(int userId, string action, string targetType, int targetId, 
            string? oldValue = null, string? newValue = null, string? reason = null, int? actionBy = null)
        {
            try
            {
                var auditLog = new PermissionAuditLog
                {
                    UserID = userId,
                    Action = action,
                    TargetType = targetType,
                    TargetID = targetId,
                    OldValue = oldValue,
                    NewValue = newValue,
                    Reason = reason,
                    ActionBy = actionBy,
                    ActionDate = DateTime.UtcNow
                };

                _context.PermissionAuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging permission action for user {UserId}", userId);
            }
        }
    }
}
