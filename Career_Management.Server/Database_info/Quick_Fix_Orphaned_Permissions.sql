-- =============================================
-- QUICK FIX: Delete Orphaned Role Permissions
-- Run this in SQL Server Management Studio
-- =============================================

USE [CareerManagement];
GO

-- Show what will be deleted
PRINT 'Orphaned Role Permissions to be deleted:'
SELECT 
    rp.RolePermissionID,
    r.RoleName,
    rp.PermissionID,
    'Permission no longer exists or is inactive' as Reason
FROM RolePermissions rp
INNER JOIN Roles r ON rp.RoleID = r.RoleID
LEFT JOIN Permissions p ON rp.PermissionID = p.PermissionID
WHERE p.PermissionID IS NULL OR p.IsActive = 0;

-- Delete orphaned entries
DELETE rp
FROM RolePermissions rp
LEFT JOIN Permissions p ON rp.PermissionID = p.PermissionID
WHERE p.PermissionID IS NULL OR p.IsActive = 0;

PRINT 'Cleanup complete! Refresh your browser and try again.'
GO

