-- =============================================
-- Cleanup User Management System
-- Run this script if you need to reset the user management system
-- =============================================

USE CareerManagementDB;
GO

PRINT 'Cleaning up User Management System...';

-- Remove user roles first (due to foreign key constraints)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    DELETE FROM UserRoles;
    PRINT 'User roles cleared.';
END

-- Remove user permission overrides
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPermissionOverrides')
BEGIN
    DELETE FROM UserPermissionOverrides;
    PRINT 'User permission overrides cleared.';
END

-- Remove audit logs (optional - comment out if you want to keep audit history)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PermissionAuditLog')
BEGIN
    DELETE FROM PermissionAuditLog;
    PRINT 'Permission audit log cleared.';
END

-- Remove users (but keep the table structure)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    DELETE FROM Users;
    PRINT 'Users cleared.';
END

-- Remove role permissions
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    DELETE FROM RolePermissions;
    PRINT 'Role permissions cleared.';
END

-- Remove permissions
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions')
BEGIN
    DELETE FROM Permissions;
    PRINT 'Permissions cleared.';
END

-- Remove roles
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    DELETE FROM Roles;
    PRINT 'Roles cleared.';
END

-- Remove permission types
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'PermissionTypes')
BEGIN
    DELETE FROM PermissionTypes;
    PRINT 'Permission types cleared.';
END

-- Remove application modules
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ApplicationModules')
BEGIN
    DELETE FROM ApplicationModules;
    PRINT 'Application modules cleared.';
END

-- Reset identity columns if needed
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    DBCC CHECKIDENT ('Users', RESEED, 0);
    DBCC CHECKIDENT ('ApplicationModules', RESEED, 0);
    DBCC CHECKIDENT ('PermissionTypes', RESEED, 0);
    DBCC CHECKIDENT ('Permissions', RESEED, 0);
    DBCC CHECKIDENT ('Roles', RESEED, 0);
    DBCC CHECKIDENT ('RolePermissions', RESEED, 0);
    DBCC CHECKIDENT ('UserRoles', RESEED, 0);
    DBCC CHECKIDENT ('UserPermissionOverrides', RESEED, 0);
    DBCC CHECKIDENT ('PermissionAuditLog', RESEED, 0);
    PRINT 'Identity columns reset.';
END

PRINT 'User Management System cleanup completed successfully!';
PRINT 'You can now run Setup_User_Management.sql again to reinitialize the system.';
