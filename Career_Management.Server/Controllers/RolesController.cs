using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;
using Career_Management.Server.Services;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class RolesController : BaseAuthController
    {
        private readonly CareerManagementContext _context;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<RolesController> _logger;

        public RolesController(CareerManagementContext context, IPermissionService permissionService, ILogger<RolesController> logger)
        {
            _context = context;
            _permissionService = permissionService;
            _logger = logger;
        }

        // GET: api/Roles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RoleDto>>> GetRoles()
        {
            try
            {
                var roles = await _context.Roles
                    .Include(r => r.Department)
                    .Include(r => r.Company)
                    .Include(r => r.RolePermissions.Where(rp => rp.IsActive))
                    .ThenInclude(rp => rp.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .Include(r => r.UserRoles.Where(ur => ur.IsActive))
                    .Where(r => r.IsActive)
                    .Select(r => new RoleDto
                    {
                        RoleID = r.RoleID,
                        RoleName = r.RoleName,
                        RoleDescription = r.RoleDescription,
                        RoleCode = r.RoleCode,
                        IsSystemRole = r.IsSystemRole,
                        DepartmentID = r.DepartmentID,
                        DepartmentName = r.Department != null ? r.Department.DepartmentName : null,
                        CompanyID = r.CompanyID,
                        CompanyName = r.Company != null ? r.Company.CompanyName : null,
                        IsActive = r.IsActive,
                        CreatedDate = r.CreatedDate,
                        PermissionCount = r.RolePermissions.Count(rp => rp.IsActive),
                        UserCount = r.UserRoles.Count(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)),
                        Permissions = r.RolePermissions.Where(rp => rp.IsActive).Select(rp => new PermissionDto
                        {
                            PermissionID = rp.Permission.PermissionID,
                            ModuleID = rp.Permission.ModuleID,
                            ModuleName = rp.Permission.Module.ModuleName,
                            ModuleCode = rp.Permission.Module.ModuleCode,
                            PermissionTypeID = rp.Permission.PermissionTypeID,
                            PermissionName = rp.Permission.PermissionType.PermissionName,
                            PermissionCode = rp.Permission.PermissionType.PermissionCode,
                            PermissionFullName = rp.Permission.Module.ModuleCode + "_" + rp.Permission.PermissionType.PermissionCode,
                            Description = rp.Permission.Description,
                            IsActive = rp.Permission.IsActive
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving roles");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Roles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RoleDto>> GetRole(int id)
        {
            try
            {
                var role = await _context.Roles
                    .Include(r => r.Department)
                    .Include(r => r.Company)
                    .Include(r => r.RolePermissions.Where(rp => rp.IsActive))
                    .ThenInclude(rp => rp.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .Include(r => r.UserRoles.Where(ur => ur.IsActive))
                    .FirstOrDefaultAsync(r => r.RoleID == id && r.IsActive);

                if (role == null)
                {
                    return NotFound();
                }

                var roleDto = new RoleDto
                {
                    RoleID = role.RoleID,
                    RoleName = role.RoleName,
                    RoleDescription = role.RoleDescription,
                    RoleCode = role.RoleCode,
                    IsSystemRole = role.IsSystemRole,
                    DepartmentID = role.DepartmentID,
                    DepartmentName = role.Department?.DepartmentName,
                    CompanyID = role.CompanyID,
                    CompanyName = role.Company?.CompanyName,
                    IsActive = role.IsActive,
                    CreatedDate = role.CreatedDate,
                    PermissionCount = role.RolePermissions.Count(rp => rp.IsActive),
                    UserCount = role.UserRoles.Count(ur => ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow)),
                    Permissions = role.RolePermissions.Where(rp => rp.IsActive).Select(rp => new PermissionDto
                    {
                        PermissionID = rp.Permission.PermissionID,
                        ModuleID = rp.Permission.ModuleID,
                        ModuleName = rp.Permission.Module.ModuleName,
                        ModuleCode = rp.Permission.Module.ModuleCode,
                        PermissionTypeID = rp.Permission.PermissionTypeID,
                        PermissionName = rp.Permission.PermissionType.PermissionName,
                        PermissionCode = rp.Permission.PermissionType.PermissionCode,
                        PermissionFullName = rp.Permission.Module.ModuleCode + "_" + rp.Permission.PermissionType.PermissionCode,
                        Description = rp.Permission.Description,
                        IsActive = rp.Permission.IsActive
                    }).ToList()
                };

                return Ok(roleDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving role {RoleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Roles/code/EMPLOYEE
        [HttpGet("code/{roleCode}")]
        public async Task<ActionResult<RoleDto>> GetRoleByCode(string roleCode)
        {
            try
            {
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == roleCode && r.IsActive);
                if (role == null)
                {
                    return NotFound();
                }

                return await GetRole(role.RoleID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving role by code {RoleCode}", roleCode);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Roles
        [HttpPost]
        public async Task<ActionResult<RoleDto>> CreateRole(CreateRoleRequest request)
        {
            try
            {
                // Check for duplicate role code
                var existingRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleCode == request.RoleCode);
                if (existingRole != null)
                {
                    return BadRequest("Role code already exists");
                }

                // Validate department and company if provided
                if (request.DepartmentID.HasValue)
                {
                    var department = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentID == request.DepartmentID && d.IsActive);
                    if (department == null)
                    {
                        return BadRequest("Department not found or inactive");
                    }
                }

                if (request.CompanyID.HasValue)
                {
                    var company = await _context.Companies.FirstOrDefaultAsync(c => c.CompanyID == request.CompanyID && c.IsActive);
                    if (company == null)
                    {
                        return BadRequest("Company not found or inactive");
                    }
                }

                var role = new Role
                {
                    RoleName = request.RoleName,
                    RoleDescription = request.RoleDescription,
                    RoleCode = request.RoleCode,
                    IsSystemRole = false, // Custom roles are never system roles
                    DepartmentID = request.DepartmentID,
                    CompanyID = request.CompanyID,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    ModifiedBy = 1, // TODO: Get current user ID
                    IsActive = true
                };

                _context.Roles.Add(role);
                await _context.SaveChangesAsync();

                // Assign permissions if provided
                if (request.PermissionIDs.Any())
                {
                    var validPermissions = await _context.Permissions
                        .Where(p => request.PermissionIDs.Contains(p.PermissionID) && p.IsActive)
                        .ToListAsync();

                    foreach (var permission in validPermissions)
                    {
                        var rolePermission = new RolePermission
                        {
                            RoleID = role.RoleID,
                            PermissionID = permission.PermissionID,
                            GrantedDate = DateTime.UtcNow,
                            GrantedBy = 1, // TODO: Get current user ID
                            IsActive = true
                        };

                        _context.RolePermissions.Add(rolePermission);
                    }

                    await _context.SaveChangesAsync();
                }

                return CreatedAtAction(nameof(GetRole), new { id = role.RoleID }, await GetRole(role.RoleID));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating role");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Roles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, UpdateRoleRequest request)
        {
            try
            {
                _logger.LogInformation("Updating role {RoleId} with {PermissionCount} permissions", id, request.PermissionIDs?.Count ?? 0);
                
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleID == id && r.IsActive);
                if (role == null)
                {
                    _logger.LogWarning("Role {RoleId} not found", id);
                    return NotFound();
                }

                // Don't allow modification of system roles
                if (role.IsSystemRole)
                {
                    _logger.LogWarning("Attempted to modify system role {RoleId}", id);
                    return BadRequest("Cannot modify system roles");
                }

                var oldValues = new List<string>();
                var newValues = new List<string>();

                if (request.RoleName != null && request.RoleName != role.RoleName)
                {
                    oldValues.Add($"RoleName: {role.RoleName}");
                    newValues.Add($"RoleName: {request.RoleName}");
                    role.RoleName = request.RoleName;
                }

                if (request.RoleDescription != null && request.RoleDescription != role.RoleDescription)
                {
                    oldValues.Add($"RoleDescription: {role.RoleDescription}");
                    newValues.Add($"RoleDescription: {request.RoleDescription}");
                    role.RoleDescription = request.RoleDescription;
                }

                if (request.IsActive.HasValue && request.IsActive != role.IsActive)
                {
                    oldValues.Add($"IsActive: {role.IsActive}");
                    newValues.Add($"IsActive: {request.IsActive}");
                    role.IsActive = request.IsActive.Value;
                }

                role.ModifiedDate = DateTime.UtcNow;
                role.ModifiedBy = 1; // TODO: Get current user ID

                // Update permissions if provided
                if (request.PermissionIDs != null)
                {
                    _logger.LogInformation("Updating permissions for role {RoleId}. Requested: {RequestedCount} permission IDs", id, request.PermissionIDs.Count);
                    
                    // Get ALL existing permissions (including inactive ones)
                    var allExistingPermissions = await _context.RolePermissions
                        .Where(rp => rp.RoleID == id)
                        .ToListAsync();

                    _logger.LogInformation("Found {TotalCount} total existing role permissions ({ActiveCount} active)", 
                        allExistingPermissions.Count, allExistingPermissions.Count(rp => rp.IsActive));

                    // Deactivate all existing permissions first
                    foreach (var existingPermission in allExistingPermissions)
                    {
                        existingPermission.IsActive = false;
                    }

                    // Add new permissions - validate they exist
                    var validPermissions = await _context.Permissions
                        .Where(p => request.PermissionIDs.Contains(p.PermissionID) && p.IsActive)
                        .Include(p => p.Module)
                        .Include(p => p.PermissionType)
                        .ToListAsync();

                    _logger.LogInformation("Found {ValidCount} valid permissions out of {RequestedCount} requested", 
                        validPermissions.Count, request.PermissionIDs.Count);

                    // Log any invalid permission IDs
                    var validPermissionIds = validPermissions.Select(p => p.PermissionID).ToHashSet();
                    var invalidPermissionIds = request.PermissionIDs.Where(pid => !validPermissionIds.Contains(pid)).ToList();
                    
                    if (invalidPermissionIds.Any())
                    {
                        _logger.LogWarning("Invalid permission IDs requested: {InvalidIds}", string.Join(", ", invalidPermissionIds));
                    }

                    foreach (var permission in validPermissions)
                    {
                        // Check if this permission already exists (even if inactive)
                        var existingRolePermission = allExistingPermissions
                            .FirstOrDefault(rp => rp.PermissionID == permission.PermissionID);

                        if (existingRolePermission != null)
                        {
                            // Reactivate existing permission
                            existingRolePermission.IsActive = true;
                            existingRolePermission.GrantedDate = DateTime.UtcNow;
                            existingRolePermission.GrantedBy = 1; // TODO: Get current user ID
                        }
                        else
                        {
                            // Create new permission entry
                            var rolePermission = new RolePermission
                            {
                                RoleID = role.RoleID,
                                PermissionID = permission.PermissionID,
                                GrantedDate = DateTime.UtcNow,
                                GrantedBy = 1, // TODO: Get current user ID
                                IsActive = true
                            };

                            _context.RolePermissions.Add(rolePermission);
                        }
                    }

                    oldValues.Add($"Permissions: {allExistingPermissions.Count(rp => rp.IsActive)} permissions");
                    newValues.Add($"Permissions: {validPermissions.Count} permissions");
                }

                await _context.SaveChangesAsync();

                // Log the changes
                if (oldValues.Any())
                {
                    await _permissionService.LogPermissionActionAsync(1, "ROLE_UPDATED", "ROLE", role.RoleID, 
                        string.Join("; ", oldValues), string.Join("; ", newValues), "Role updated", 1);
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating role {RoleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Roles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            try
            {
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleID == id);
                if (role == null)
                {
                    return NotFound();
                }

                // Don't allow deletion of system roles
                if (role.IsSystemRole)
                {
                    return BadRequest("Cannot delete system roles");
                }

                // Check if role is assigned to any users
                var hasActiveUsers = await _context.UserRoles
                    .AnyAsync(ur => ur.RoleID == id && ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow));

                if (hasActiveUsers)
                {
                    return BadRequest("Cannot delete role that is assigned to active users");
                }

                // Soft delete
                role.IsActive = false;
                role.ModifiedDate = DateTime.UtcNow;
                role.ModifiedBy = 1; // TODO: Get current user ID

                // Deactivate role permissions
                var rolePermissions = await _context.RolePermissions.Where(rp => rp.RoleID == id && rp.IsActive).ToListAsync();
                foreach (var rolePermission in rolePermissions)
                {
                    rolePermission.IsActive = false;
                }

                await _context.SaveChangesAsync();

                await _permissionService.LogPermissionActionAsync(1, "ROLE_DELETED", "ROLE", id, 
                    role.RoleName, "Deleted", "Role deleted", 1);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting role {RoleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Roles/5/permissions
        [HttpGet("{id}/permissions")]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetRolePermissions(int id)
        {
            try
            {
                var permissions = await _context.RolePermissions
                    .Where(rp => rp.RoleID == id && rp.IsActive)
                    .Include(rp => rp.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(rp => rp.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .Select(rp => new PermissionDto
                    {
                        PermissionID = rp.Permission.PermissionID,
                        ModuleID = rp.Permission.ModuleID,
                        ModuleName = rp.Permission.Module.ModuleName,
                        ModuleCode = rp.Permission.Module.ModuleCode,
                        PermissionTypeID = rp.Permission.PermissionTypeID,
                        PermissionName = rp.Permission.PermissionType.PermissionName,
                        PermissionCode = rp.Permission.PermissionType.PermissionCode,
                        PermissionFullName = rp.Permission.Module.ModuleCode + "_" + rp.Permission.PermissionType.PermissionCode,
                        Description = rp.Permission.Description,
                        IsActive = rp.Permission.IsActive
                    })
                    .ToListAsync();

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permissions for role {RoleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Roles/5/users
        [HttpGet("{id}/users")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetRoleUsers(int id)
        {
            try
            {
                var users = await _context.UserRoles
                    .Where(ur => ur.RoleID == id && ur.IsActive && (ur.ExpiryDate == null || ur.ExpiryDate > DateTime.UtcNow))
                    .Include(ur => ur.User)
                    .ThenInclude(u => u.Employee)
                    .ThenInclude(e => e.Position)
                    .ThenInclude(p => p.DepartmentNavigation)
                    .Select(ur => new UserDto
                    {
                        UserID = ur.User.UserID,
                        EmployeeID = ur.User.EmployeeID,
                        Username = ur.User.Username,
                        IsSystemAdmin = ur.User.IsSystemAdmin,
                        LastLoginDate = ur.User.LastLoginDate,
                        CreatedDate = ur.User.CreatedDate,
                        IsActive = ur.User.IsActive,
                        EmployeeFullName = ur.User.Employee.FirstName + " " + ur.User.Employee.LastName,
                        EmployeeEmail = ur.User.Employee.Email,
                        DepartmentName = ur.User.Employee.Position.DepartmentNavigation != null ? ur.User.Employee.Position.DepartmentNavigation.DepartmentName : null,
                        PositionTitle = ur.User.Employee.Position.PositionTitle
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users for role {RoleId}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
