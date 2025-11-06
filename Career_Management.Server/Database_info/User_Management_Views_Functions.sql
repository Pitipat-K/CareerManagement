-- =============================================
-- User Management Views and Functions
-- Create helpful views and functions for user permission management
-- =============================================

USE CareerManagementDB;
GO

-- =============================================
-- CREATE HELPFUL VIEWS
-- =============================================

-- Drop existing views if they exist
IF OBJECT_ID('vw_UserPermissions', 'V') IS NOT NULL
    DROP VIEW vw_UserPermissions;
GO

IF OBJECT_ID('vw_UserRoleSummary', 'V') IS NOT NULL
    DROP VIEW vw_UserRoleSummary;
GO

IF OBJECT_ID('vw_RolePermissionSummary', 'V') IS NOT NULL
    DROP VIEW vw_RolePermissionSummary;
GO

IF OBJECT_ID('vw_PermissionAuditSummary', 'V') IS NOT NULL
    DROP VIEW vw_PermissionAuditSummary;
GO

-- View to get all user permissions (including role-based and overrides)
CREATE VIEW vw_UserPermissions AS
WITH RoleBasedPermissions AS (
    SELECT 
        u.UserID,
        u.EmployeeID,
        e.FirstName + ' ' + e.LastName AS FullName,
        m.ModuleName,
        m.ModuleCode,
        pt.PermissionName,
        pt.PermissionCode,
        m.ModuleCode + '_' + pt.PermissionCode AS PermissionFullName,
        r.RoleName,
        'Role' AS PermissionSource,
        1 AS IsGranted,
        ur.AssignedDate AS EffectiveDate,
        ur.ExpiryDate
    FROM Users u
    INNER JOIN Employees e ON u.EmployeeID = e.EmployeeID
    INNER JOIN UserRoles ur ON u.UserID = ur.UserID AND ur.IsActive = 1
    INNER JOIN Roles r ON ur.RoleID = r.RoleID AND r.IsActive = 1
    INNER JOIN RolePermissions rp ON r.RoleID = rp.RoleID AND rp.IsActive = 1
    INNER JOIN Permissions p ON rp.PermissionID = p.PermissionID AND p.IsActive = 1
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID AND m.IsActive = 1
    INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID AND pt.IsActive = 1
    WHERE u.IsActive = 1
    AND (ur.ExpiryDate IS NULL OR ur.ExpiryDate > GETDATE())
),
OverridePermissions AS (
    SELECT 
        u.UserID,
        u.EmployeeID,
        e.FirstName + ' ' + e.LastName AS FullName,
        m.ModuleName,
        m.ModuleCode,
        pt.PermissionName,
        pt.PermissionCode,
        m.ModuleCode + '_' + pt.PermissionCode AS PermissionFullName,
        'Override' AS RoleName,
        'Override' AS PermissionSource,
        upo.IsGranted,
        upo.CreatedDate AS EffectiveDate,
        upo.ExpiryDate
    FROM Users u
    INNER JOIN Employees e ON u.EmployeeID = e.EmployeeID
    INNER JOIN UserPermissionOverrides upo ON u.UserID = upo.UserID AND upo.IsActive = 1
    INNER JOIN Permissions p ON upo.PermissionID = p.PermissionID AND p.IsActive = 1
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID AND m.IsActive = 1
    INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID AND pt.IsActive = 1
    WHERE u.IsActive = 1
    AND (upo.ExpiryDate IS NULL OR upo.ExpiryDate > GETDATE())
)
SELECT * FROM RoleBasedPermissions
UNION ALL
SELECT * FROM OverridePermissions;
GO

-- View for user role summary
CREATE VIEW vw_UserRoleSummary AS
SELECT 
    u.UserID,
    u.EmployeeID,
    u.Username,
    e.FirstName + ' ' + e.LastName AS FullName,
    e.Email,
    d.DepartmentName,
    pos.PositionTitle,
    STRING_AGG(r.RoleName, ', ') AS Roles,
    COUNT(DISTINCT ur.RoleID) AS RoleCount,
    u.IsSystemAdmin,
    u.LastLoginDate,
    u.IsActive,
    u.CreatedDate
FROM Users u
INNER JOIN Employees e ON u.EmployeeID = e.EmployeeID
LEFT JOIN Positions pos ON e.PositionID = pos.PositionID
LEFT JOIN Departments d ON pos.DepartmentID = d.DepartmentID
LEFT JOIN UserRoles ur ON u.UserID = ur.UserID AND ur.IsActive = 1 
    AND (ur.ExpiryDate IS NULL OR ur.ExpiryDate > GETDATE())
LEFT JOIN Roles r ON ur.RoleID = r.RoleID AND r.IsActive = 1
WHERE u.IsActive = 1
GROUP BY u.UserID, u.EmployeeID, u.Username, e.FirstName, e.LastName, 
         e.Email, d.DepartmentName, pos.PositionTitle, u.IsSystemAdmin, 
         u.LastLoginDate, u.IsActive, u.CreatedDate;
GO

-- View for role permission summary
CREATE VIEW vw_RolePermissionSummary AS
SELECT 
    r.RoleID,
    r.RoleName,
    r.RoleCode,
    r.RoleDescription,
    r.IsSystemRole,
    COUNT(DISTINCT rp.PermissionID) AS PermissionCount,
    COUNT(DISTINCT ur.UserID) AS UserCount,
    STRING_AGG(
        m.ModuleCode + '_' + pt.PermissionCode, 
        ', '
    ) AS Permissions
FROM Roles r
LEFT JOIN RolePermissions rp ON r.RoleID = rp.RoleID AND rp.IsActive = 1
LEFT JOIN Permissions p ON rp.PermissionID = p.PermissionID AND p.IsActive = 1
LEFT JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
LEFT JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
LEFT JOIN UserRoles ur ON r.RoleID = ur.RoleID AND ur.IsActive = 1
WHERE r.IsActive = 1
GROUP BY r.RoleID, r.RoleName, r.RoleCode, r.RoleDescription, r.IsSystemRole;
GO

-- View for permission audit summary
CREATE VIEW vw_PermissionAuditSummary AS
SELECT 
    pal.AuditID,
    pal.ActionDate,
    pal.Action,
    u.Username,
    e.FirstName + ' ' + e.LastName AS UserFullName,
    pal.TargetType,
    CASE 
        WHEN pal.TargetType = 'ROLE' THEN r.RoleName
        WHEN pal.TargetType = 'PERMISSION' THEN p.Description
        ELSE 'Unknown'
    END AS TargetName,
    pal.OldValue,
    pal.NewValue,
    pal.Reason,
    ab.FirstName + ' ' + ab.LastName AS ActionByName
FROM PermissionAuditLog pal
INNER JOIN Users u ON pal.UserID = u.UserID
INNER JOIN Employees e ON u.EmployeeID = e.EmployeeID
LEFT JOIN Roles r ON pal.TargetType = 'ROLE' AND pal.TargetID = r.RoleID
LEFT JOIN Permissions p ON pal.TargetType = 'PERMISSION' AND pal.TargetID = p.PermissionID
LEFT JOIN Employees ab ON pal.ActionBy = ab.EmployeeID;
GO

-- =============================================
-- CREATE PERMISSION CHECK FUNCTIONS
-- =============================================

-- Drop existing functions if they exist
IF OBJECT_ID('fn_HasPermission', 'FN') IS NOT NULL
    DROP FUNCTION fn_HasPermission;
GO

IF OBJECT_ID('fn_GetUserPermissions', 'IF') IS NOT NULL
    DROP FUNCTION fn_GetUserPermissions;
GO

-- Function to check if user has specific permission
CREATE FUNCTION fn_HasPermission(@UserID INT, @ModuleCode VARCHAR(50), @PermissionCode VARCHAR(20))
RETURNS BIT
AS
BEGIN
    DECLARE @HasPermission BIT = 0;
    
    -- Check if user exists and is active
    IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID AND IsActive = 1)
        RETURN 0;
    
    -- Check if user is system admin
    IF EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID AND IsSystemAdmin = 1 AND IsActive = 1)
        SET @HasPermission = 1;
    ELSE
    BEGIN
        -- Check for explicit deny override first
        IF EXISTS (
            SELECT 1 FROM vw_UserPermissions 
            WHERE UserID = @UserID 
            AND ModuleCode = @ModuleCode 
            AND PermissionCode = @PermissionCode
            AND PermissionSource = 'Override'
            AND IsGranted = 0
        )
            SET @HasPermission = 0;
        -- Check for permission grant (role or override)
        ELSE IF EXISTS (
            SELECT 1 FROM vw_UserPermissions 
            WHERE UserID = @UserID 
            AND ModuleCode = @ModuleCode 
            AND PermissionCode = @PermissionCode
            AND IsGranted = 1
        )
            SET @HasPermission = 1;
    END
    
    RETURN @HasPermission;
END;
GO

-- Table-valued function to get all permissions for a user
CREATE FUNCTION fn_GetUserPermissions(@UserID INT)
RETURNS TABLE
AS
RETURN (
    SELECT DISTINCT
        ModuleCode,
        PermissionCode,
        PermissionFullName,
        ModuleName,
        PermissionName,
        MAX(CAST(IsGranted AS INT)) AS IsGranted -- In case of conflicts, grant wins over deny
    FROM vw_UserPermissions 
    WHERE UserID = @UserID
    GROUP BY ModuleCode, PermissionCode, PermissionFullName, ModuleName, PermissionName
    
    UNION
    
    -- Add all permissions for system admins
    SELECT DISTINCT
        m.ModuleCode,
        pt.PermissionCode,
        m.ModuleCode + '_' + pt.PermissionCode AS PermissionFullName,
        m.ModuleName,
        pt.PermissionName,
        1 AS IsGranted
    FROM ApplicationModules m
    CROSS JOIN PermissionTypes pt
    WHERE EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID AND IsSystemAdmin = 1 AND IsActive = 1)
    AND m.IsActive = 1 AND pt.IsActive = 1
);
GO

-- =============================================
-- CREATE STORED PROCEDURES FOR USER MANAGEMENT
-- =============================================

-- Drop existing procedures if they exist
IF OBJECT_ID('sp_AssignRoleToUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_AssignRoleToUser;
GO

IF OBJECT_ID('sp_RemoveRoleFromUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_RemoveRoleFromUser;
GO

IF OBJECT_ID('sp_CreateUserFromEmployee', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateUserFromEmployee;
GO

-- Stored procedure to assign role to user
CREATE PROCEDURE sp_AssignRoleToUser
    @UserID INT,
    @RoleID INT,
    @AssignedBy INT,
    @ExpiryDate DATETIME2 = NULL,
    @Reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    DECLARE @RoleName NVARCHAR(100);
    
    BEGIN TRY
        -- Validate inputs
        IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID AND IsActive = 1)
        BEGIN
            SET @ErrorMessage = 'User not found or inactive';
            THROW 50001, @ErrorMessage, 1;
        END
        
        IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleID = @RoleID AND IsActive = 1)
        BEGIN
            SET @ErrorMessage = 'Role not found or inactive';
            THROW 50002, @ErrorMessage, 1;
        END
        
        -- Get role name for audit
        SELECT @RoleName = RoleName FROM Roles WHERE RoleID = @RoleID;
        
        -- Check if assignment already exists
        IF EXISTS (SELECT 1 FROM UserRoles WHERE UserID = @UserID AND RoleID = @RoleID AND IsActive = 1)
        BEGIN
        -- Update expiry date if provided
        IF @ExpiryDate IS NOT NULL
        BEGIN
            UPDATE UserRoles 
            SET ExpiryDate = @ExpiryDate, 
                AssignedDate = GETDATE(),
                AssignedBy = @AssignedBy
            WHERE UserID = @UserID AND RoleID = @RoleID AND IsActive = 1;
                
                -- Log the change
                INSERT INTO PermissionAuditLog (UserID, Action, TargetType, TargetID, NewValue, Reason, ActionBy)
                VALUES (@UserID, 'ROLE_UPDATED', 'ROLE', @RoleID, 
                        'Expiry date updated to ' + CONVERT(VARCHAR, @ExpiryDate), @Reason, @AssignedBy);
            END
            
            RETURN; -- Role already assigned
        END
        
        -- Assign the role
        INSERT INTO UserRoles (UserID, RoleID, ExpiryDate, AssignedBy)
        VALUES (@UserID, @RoleID, @ExpiryDate, @AssignedBy);
        
        -- Log the assignment
        INSERT INTO PermissionAuditLog (UserID, Action, TargetType, TargetID, NewValue, Reason, ActionBy)
        VALUES (@UserID, 'ROLE_ASSIGNED', 'ROLE', @RoleID, @RoleName, @Reason, @AssignedBy);
        
        SELECT 'Role assigned successfully' AS Message;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- Stored procedure to remove role from user
CREATE PROCEDURE sp_RemoveRoleFromUser
    @UserID INT,
    @RoleID INT,
    @RemovedBy INT,
    @Reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    DECLARE @RoleName NVARCHAR(100);
    
    BEGIN TRY
        -- Validate inputs
        IF NOT EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID AND IsActive = 1)
        BEGIN
            SET @ErrorMessage = 'User not found or inactive';
            THROW 50001, @ErrorMessage, 1;
        END
        
        IF NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserID = @UserID AND RoleID = @RoleID AND IsActive = 1)
        BEGIN
            SET @ErrorMessage = 'Role assignment not found';
            THROW 50003, @ErrorMessage, 1;
        END
        
        -- Get role name for audit
        SELECT @RoleName = RoleName FROM Roles WHERE RoleID = @RoleID;
        
        -- Remove the role (soft delete)
        UPDATE UserRoles 
        SET IsActive = 0
        WHERE UserID = @UserID AND RoleID = @RoleID AND IsActive = 1;
        
        -- Log the removal
        INSERT INTO PermissionAuditLog (UserID, Action, TargetType, TargetID, OldValue, Reason, ActionBy)
        VALUES (@UserID, 'ROLE_REMOVED', 'ROLE', @RoleID, @RoleName, @Reason, @RemovedBy);
        
        SELECT 'Role removed successfully' AS Message;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- Stored procedure to create user from employee
CREATE PROCEDURE sp_CreateUserFromEmployee
    @EmployeeID INT,
    @Username NVARCHAR(100) = NULL,
    @IsSystemAdmin BIT = 0,
    @DefaultRoleCode NVARCHAR(50) = 'EMPLOYEE',
    @CreatedBy INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    DECLARE @UserID INT;
    DECLARE @RoleID INT;
    DECLARE @Email NVARCHAR(100);
    
    BEGIN TRY
        -- Validate employee exists
        IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeID = @EmployeeID AND IsActive = 1)
        BEGIN
            SET @ErrorMessage = 'Employee not found or inactive';
            THROW 50001, @ErrorMessage, 1;
        END
        
        -- Check if user already exists for this employee
        IF EXISTS (SELECT 1 FROM Users WHERE EmployeeID = @EmployeeID)
        BEGIN
            SET @ErrorMessage = 'User already exists for this employee';
            THROW 50004, @ErrorMessage, 1;
        END
        
        -- Get employee email for username if not provided
        SELECT @Email = Email FROM Employees WHERE EmployeeID = @EmployeeID;
        IF @Username IS NULL
            SET @Username = ISNULL(@Email, 'employee' + CAST(@EmployeeID AS VARCHAR(10)) + '@company.com');
        
        -- Create the user
        INSERT INTO Users (EmployeeID, Username, IsSystemAdmin, CreatedDate, ModifiedBy)
        VALUES (@EmployeeID, @Username, @IsSystemAdmin, GETDATE(), @CreatedBy);
        
        SET @UserID = SCOPE_IDENTITY();
        
        -- Assign default role if not system admin
        IF @IsSystemAdmin = 0 AND @DefaultRoleCode IS NOT NULL
        BEGIN
            SELECT @RoleID = RoleID FROM Roles WHERE RoleCode = @DefaultRoleCode AND IsActive = 1;
            
            IF @RoleID IS NOT NULL
            BEGIN
                EXEC sp_AssignRoleToUser @UserID, @RoleID, @CreatedBy, NULL, 'Default role assignment';
            END
        END
        
        -- Log user creation
        INSERT INTO PermissionAuditLog (UserID, Action, TargetType, TargetID, NewValue, ActionBy)
        VALUES (@UserID, 'USER_CREATED', 'USER', @UserID, 'User created from Employee ID: ' + CAST(@EmployeeID AS VARCHAR(10)), @CreatedBy);
        
        SELECT 'User created successfully' AS Message, @UserID AS UserID;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

PRINT 'User Management views, functions, and procedures created successfully!';
PRINT '';
PRINT '=== AVAILABLE VIEWS ===';
PRINT '- vw_UserPermissions: All user permissions with source';
PRINT '- vw_UserRoleSummary: User role summary with employee info';
PRINT '- vw_RolePermissionSummary: Role permission counts and details';
PRINT '- vw_PermissionAuditSummary: Audit log with readable names';
PRINT '';
PRINT '=== AVAILABLE FUNCTIONS ===';
PRINT '- fn_HasPermission(@UserID, @ModuleCode, @PermissionCode): Check specific permission';
PRINT '- fn_GetUserPermissions(@UserID): Get all permissions for a user';
PRINT '';
PRINT '=== AVAILABLE PROCEDURES ===';
PRINT '- sp_AssignRoleToUser: Assign role to user with audit';
PRINT '- sp_RemoveRoleFromUser: Remove role from user with audit';
PRINT '- sp_CreateUserFromEmployee: Create user account from employee';
PRINT '==========================';
