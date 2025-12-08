using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models.DTOs;
using Career_Management.Server.Services;

namespace Career_Management.Server.Controllers
{
    [Route("api/[controller]")]
    public class PermissionsController : BaseAuthController
    {
        private readonly CareerManagementContext _context;
        private readonly IPermissionService _permissionService;
        private readonly ILogger<PermissionsController> _logger;

        public PermissionsController(CareerManagementContext context, IPermissionService permissionService, ILogger<PermissionsController> logger)
        {
            _context = context;
            _permissionService = permissionService;
            _logger = logger;
        }

        // GET: api/Permissions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PermissionDto>>> GetPermissions()
        {
            try
            {
                var permissions = await _context.Permissions
                    .Include(p => p.Module)
                    .Include(p => p.PermissionType)
                    .Where(p => p.IsActive && p.Module.IsActive && p.PermissionType.IsActive)
                    .Select(p => new PermissionDto
                    {
                        PermissionID = p.PermissionID,
                        ModuleID = p.ModuleID,
                        ModuleName = p.Module.ModuleName,
                        ModuleCode = p.Module.ModuleCode,
                        PermissionTypeID = p.PermissionTypeID,
                        PermissionName = p.PermissionType.PermissionName,
                        PermissionCode = p.PermissionType.PermissionCode,
                        PermissionFullName = p.Module.ModuleCode + "_" + p.PermissionType.PermissionCode,
                        Description = p.Description,
                        IsActive = p.IsActive
                    })
                    .OrderBy(p => p.ModuleName)
                    .ThenBy(p => p.PermissionName)
                    .ToListAsync();

                return Ok(permissions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permissions");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Permissions/modules
        [HttpGet("modules")]
        public async Task<ActionResult<IEnumerable<object>>> GetModules()
        {
            try
            {
                var modules = await _context.ApplicationModules
                    .Where(m => m.IsActive)
                    .Select(m => new
                    {
                        m.ModuleID,
                        m.ModuleName,
                        m.ModuleCode,
                        m.ModuleDescription,
                        m.DisplayOrder,
                        PermissionCount = m.Permissions.Count(p => p.IsActive)
                    })
                    .OrderBy(m => m.DisplayOrder)
                    .ToListAsync();

                return Ok(modules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving modules");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Permissions/types
        [HttpGet("types")]
        public async Task<ActionResult<IEnumerable<object>>> GetPermissionTypes()
        {
            try
            {
                var permissionTypes = await _context.PermissionTypes
                    .Where(pt => pt.IsActive)
                    .Select(pt => new
                    {
                        pt.PermissionTypeID,
                        pt.PermissionName,
                        pt.PermissionCode,
                        pt.PermissionDescription,
                        PermissionCount = pt.Permissions.Count(p => p.IsActive)
                    })
                    .ToListAsync();

                return Ok(permissionTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permission types");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Permissions/matrix
        [HttpGet("matrix")]
        public async Task<ActionResult<object>> GetPermissionMatrix()
        {
            try
            {
                var modules = await _context.ApplicationModules
                    .Where(m => m.IsActive)
                    .OrderBy(m => m.DisplayOrder)
                    .ToListAsync();

                var permissionTypes = await _context.PermissionTypes
                    .Where(pt => pt.IsActive)
                    .ToListAsync();

                var permissions = await _context.Permissions
                    .Include(p => p.Module)
                    .Include(p => p.PermissionType)
                    .Where(p => p.IsActive)
                    .ToListAsync();

                var matrix = new
                {
                    Modules = modules.Select(m => new
                    {
                        m.ModuleID,
                        m.ModuleName,
                        m.ModuleCode,
                        m.ModuleDescription
                    }),
                    PermissionTypes = permissionTypes.Select(pt => new
                    {
                        pt.PermissionTypeID,
                        pt.PermissionName,
                        pt.PermissionCode,
                        pt.PermissionDescription
                    }),
                    Permissions = permissions.Select(p => new
                    {
                        p.PermissionID,
                        p.ModuleID,
                        p.PermissionTypeID,
                        PermissionFullName = p.Module.ModuleCode + "_" + p.PermissionType.PermissionCode,
                        p.Description
                    })
                };

                return Ok(matrix);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permission matrix");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Permissions/override
        [HttpPost("override")]
        public async Task<IActionResult> CreatePermissionOverride(PermissionOverrideRequest request)
        {
            try
            {
                // Validate user exists
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == request.UserID && u.IsActive);
                if (user == null)
                {
                    return BadRequest("User not found or inactive");
                }

                // Validate permission exists
                var permission = await _context.Permissions.FirstOrDefaultAsync(p => p.PermissionID == request.PermissionID && p.IsActive);
                if (permission == null)
                {
                    return BadRequest("Permission not found or inactive");
                }

                // Check if override already exists
                var existingOverride = await _context.UserPermissionOverrides
                    .FirstOrDefaultAsync(upo => upo.UserID == request.UserID && upo.PermissionID == request.PermissionID && upo.IsActive);

                if (existingOverride != null)
                {
                    // Update existing override
                    existingOverride.IsGranted = request.IsGranted;
                    existingOverride.Reason = request.Reason;
                    existingOverride.ExpiryDate = request.ExpiryDate;
                    existingOverride.CreatedDate = DateTime.UtcNow;
                    existingOverride.CreatedBy = 1; // TODO: Get current user ID

                    await _context.SaveChangesAsync();

                    await _permissionService.LogPermissionActionAsync(request.UserID, "PERMISSION_OVERRIDE_UPDATED", "PERMISSION", request.PermissionID,
                        null, $"Override: {request.IsGranted}", request.Reason, 1);

                    return Ok("Permission override updated successfully");
                }
                else
                {
                    // Create new override
                    var permissionOverride = new Models.UserPermissionOverride
                    {
                        UserID = request.UserID,
                        PermissionID = request.PermissionID,
                        IsGranted = request.IsGranted,
                        Reason = request.Reason,
                        ExpiryDate = request.ExpiryDate,
                        CreatedDate = DateTime.UtcNow,
                        CreatedBy = 1, // TODO: Get current user ID
                        IsActive = true
                    };

                    _context.UserPermissionOverrides.Add(permissionOverride);
                    await _context.SaveChangesAsync();

                    await _permissionService.LogPermissionActionAsync(request.UserID, "PERMISSION_OVERRIDE_CREATED", "PERMISSION", request.PermissionID,
                        null, $"Override: {request.IsGranted}", request.Reason, 1);

                    return Ok("Permission override created successfully");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating permission override for user {UserId}, permission {PermissionId}", request.UserID, request.PermissionID);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Permissions/user/5/overrides
        [HttpGet("user/{userId}/overrides")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserPermissionOverrides(int userId)
        {
            try
            {
                var overrides = await _context.UserPermissionOverrides
                    .Where(upo => upo.UserID == userId && upo.IsActive)
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.Module)
                    .Include(upo => upo.Permission)
                    .ThenInclude(p => p.PermissionType)
                    .Include(upo => upo.CreatedByEmployee)
                    .Select(upo => new
                    {
                        upo.OverrideID,
                        upo.UserID,
                        upo.PermissionID,
                        ModuleName = upo.Permission.Module.ModuleName,
                        ModuleCode = upo.Permission.Module.ModuleCode,
                        PermissionName = upo.Permission.PermissionType.PermissionName,
                        PermissionCode = upo.Permission.PermissionType.PermissionCode,
                        PermissionFullName = upo.Permission.Module.ModuleCode + "_" + upo.Permission.PermissionType.PermissionCode,
                        upo.IsGranted,
                        upo.Reason,
                        upo.ExpiryDate,
                        upo.CreatedDate,
                        CreatedByName = upo.CreatedByEmployee != null ? upo.CreatedByEmployee.FirstName + " " + upo.CreatedByEmployee.LastName : null
                    })
                    .ToListAsync();

                return Ok(overrides);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permission overrides for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Permissions/override/5
        [HttpDelete("override/{overrideId}")]
        public async Task<IActionResult> DeletePermissionOverride(int overrideId)
        {
            try
            {
                var permissionOverride = await _context.UserPermissionOverrides
                    .FirstOrDefaultAsync(upo => upo.OverrideID == overrideId && upo.IsActive);

                if (permissionOverride == null)
                {
                    return NotFound("Permission override not found");
                }

                permissionOverride.IsActive = false;
                await _context.SaveChangesAsync();

                await _permissionService.LogPermissionActionAsync(permissionOverride.UserID, "PERMISSION_OVERRIDE_DELETED", "PERMISSION", permissionOverride.PermissionID,
                    $"Override: {permissionOverride.IsGranted}", "Deleted", "Permission override removed", 1);

                return Ok("Permission override deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting permission override {OverrideId}", overrideId);
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Permissions/audit
        [HttpGet("audit")]
        public async Task<ActionResult<IEnumerable<object>>> GetPermissionAuditLog([FromQuery] int? userId = null, [FromQuery] int days = 30)
        {
            try
            {
                var query = _context.PermissionAuditLogs
                    .Include(pal => pal.User)
                    .ThenInclude(u => u.Employee)
                    .Include(pal => pal.ActionByEmployee)
                    .Where(pal => pal.ActionDate >= DateTime.UtcNow.AddDays(-days));

                if (userId.HasValue)
                {
                    query = query.Where(pal => pal.UserID == userId.Value);
                }

                var auditLogs = await query
                    .OrderByDescending(pal => pal.ActionDate)
                    .Take(1000) // Limit to prevent large responses
                    .Select(pal => new
                    {
                        pal.AuditID,
                        pal.UserID,
                        UserName = pal.User.Employee.FirstName + " " + pal.User.Employee.LastName,
                        pal.Action,
                        pal.TargetType,
                        pal.TargetID,
                        pal.OldValue,
                        pal.NewValue,
                        pal.Reason,
                        pal.ActionDate,
                        ActionByName = pal.ActionByEmployee != null ? pal.ActionByEmployee.FirstName + " " + pal.ActionByEmployee.LastName : "System"
                    })
                    .ToListAsync();

                return Ok(auditLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving permission audit log");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
