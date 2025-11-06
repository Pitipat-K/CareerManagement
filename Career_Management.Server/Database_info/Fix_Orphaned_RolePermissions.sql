-- =============================================
-- Fix Orphaned Role Permissions
-- Clean up RolePermissions that reference deleted permissions
-- =============================================

USE [CareerManagement];
GO

PRINT '=========================================='
PRINT 'FIXING ORPHANED ROLE PERMISSIONS'
PRINT '=========================================='

-- Step 1: Find orphaned role permissions
PRINT ''
PRINT 'Step 1: Finding orphaned role permissions...'

DECLARE @OrphanedCount INT;

SELECT @OrphanedCount = COUNT(*)
FROM RolePermissions rp
LEFT JOIN Permissions p ON rp.PermissionID = p.PermissionID
WHERE p.PermissionID IS NULL OR p.IsActive = 0;

PRINT 'Found ' + CAST(@OrphanedCount AS VARCHAR) + ' orphaned role permissions'

-- Step 2: Show which roles are affected
PRINT ''
PRINT 'Affected roles:'
SELECT DISTINCT
    r.RoleID,
    r.RoleName,
    COUNT(rp.RolePermissionID) AS OrphanedPermissionCount
FROM RolePermissions rp
INNER JOIN Roles r ON rp.RoleID = r.RoleID
LEFT JOIN Permissions p ON rp.PermissionID = p.PermissionID
WHERE p.PermissionID IS NULL OR p.IsActive = 0
GROUP BY r.RoleID, r.RoleName
ORDER BY OrphanedPermissionCount DESC;

-- Step 3: Delete orphaned role permissions
PRINT ''
PRINT 'Step 3: Deleting orphaned role permissions...'

DELETE FROM RolePermissions
WHERE PermissionID IN (
    SELECT rp.PermissionID
    FROM RolePermissions rp
    LEFT JOIN Permissions p ON rp.PermissionID = p.PermissionID
    WHERE p.PermissionID IS NULL
)
OR PermissionID IN (
    SELECT rp.PermissionID
    FROM RolePermissions rp
    INNER JOIN Permissions p ON rp.PermissionID = p.PermissionID
    WHERE p.IsActive = 0
);

PRINT '✅ Deleted ' + CAST(@OrphanedCount AS VARCHAR) + ' orphaned role permissions'

-- Step 4: Verify the fix
PRINT ''
PRINT 'Step 4: Verification...'

DECLARE @RemainingOrphans INT;
SELECT @RemainingOrphans = COUNT(*)
FROM RolePermissions rp
LEFT JOIN Permissions p ON rp.PermissionID = p.PermissionID
WHERE p.PermissionID IS NULL OR p.IsActive = 0;

IF @RemainingOrphans = 0
BEGIN
    PRINT '✅ SUCCESS! No orphaned role permissions remain'
END
ELSE
BEGIN
    PRINT '⚠️ WARNING! Still found ' + CAST(@RemainingOrphans AS VARCHAR) + ' orphaned role permissions'
END

-- Step 5: Show current role permission counts
PRINT ''
PRINT 'Current role permission status:'
SELECT 
    r.RoleID,
    r.RoleName,
    r.RoleCode,
    COUNT(rp.RolePermissionID) AS TotalPermissions,
    COUNT(CASE WHEN rp.IsActive = 1 THEN 1 END) AS ActivePermissions
FROM Roles r
LEFT JOIN RolePermissions rp ON r.RoleID = rp.RoleID
WHERE r.IsActive = 1
GROUP BY r.RoleID, r.RoleName, r.RoleCode
ORDER BY r.RoleName;

PRINT ''
PRINT '=========================================='
PRINT 'ORPHANED PERMISSIONS CLEANUP COMPLETE'
PRINT '=========================================='
PRINT ''
PRINT 'Next steps:'
PRINT '1. Refresh the role management page in your browser'
PRINT '2. Reassign permissions to roles using the new granular modules'
PRINT '3. Test that permission updates work correctly'
PRINT '=========================================='

GO

