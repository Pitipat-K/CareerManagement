-- =============================================
-- Setup User Management System
-- This script sets up the complete user management and permission system
-- Run this AFTER your existing database setup
-- =============================================

USE CareerManagementDB;
GO

-- Check if User Management tables already exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    PRINT 'Setting up User Management System...';
    
    -- Execute the User Management Schema
    -- (Copy the content from User_Management_Schema.sql here or run it separately)
    
    -- Create Users table (extends Employee authentication)
    CREATE TABLE Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeID INT NOT NULL UNIQUE, -- One-to-one with Employee
        Username NVARCHAR(100) NOT NULL UNIQUE, -- Okta username/email
        IsSystemAdmin BIT DEFAULT 0, -- Super admin flag
        LastLoginDate DATETIME2,
        LoginAttempts INT DEFAULT 0,
        IsLocked BIT DEFAULT 0,
        LockoutEndDate DATETIME2,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedBy INT,
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
        FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID)
    );

    -- Create Application Modules/Resources
    CREATE TABLE ApplicationModules (
        ModuleID INT IDENTITY(1,1) PRIMARY KEY,
        ModuleName NVARCHAR(100) NOT NULL UNIQUE,
        ModuleDescription NVARCHAR(500),
        ModuleCode NVARCHAR(50) NOT NULL UNIQUE, -- For programmatic access
        DisplayOrder INT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedBy INT,
        FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID)
    );

    -- Create Permission Types
    CREATE TABLE PermissionTypes (
        PermissionTypeID INT IDENTITY(1,1) PRIMARY KEY,
        PermissionName NVARCHAR(50) NOT NULL UNIQUE, -- CREATE, READ, UPDATE, DELETE, APPROVE, MANAGE
        PermissionDescription NVARCHAR(200),
        PermissionCode NVARCHAR(20) NOT NULL UNIQUE, -- C, R, U, D, A, M
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedBy INT,
        FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID)
    );

    -- Create Permissions (Module + Permission Type combinations)
    CREATE TABLE Permissions (
        PermissionID INT IDENTITY(1,1) PRIMARY KEY,
        ModuleID INT NOT NULL,
        PermissionTypeID INT NOT NULL,
        Description NVARCHAR(200),
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedBy INT,
        FOREIGN KEY (ModuleID) REFERENCES ApplicationModules(ModuleID),
        FOREIGN KEY (PermissionTypeID) REFERENCES PermissionTypes(PermissionTypeID),
        FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID),
        UNIQUE (ModuleID, PermissionTypeID)
    );

    -- Create Roles
    CREATE TABLE Roles (
        RoleID INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(100) NOT NULL UNIQUE,
        RoleDescription NVARCHAR(500),
        RoleCode NVARCHAR(50) NOT NULL UNIQUE,
        IsSystemRole BIT DEFAULT 0, -- System-defined vs custom roles
        DepartmentID INT NULL, -- Department-specific roles
        CompanyID INT NULL, -- Company-specific roles
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedBy INT,
        FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID),
        FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID)
    );

    -- Create Role-Permission mapping
    CREATE TABLE RolePermissions (
        RolePermissionID INT IDENTITY(1,1) PRIMARY KEY,
        RoleID INT NOT NULL,
        PermissionID INT NOT NULL,
        GrantedDate DATETIME2 DEFAULT GETDATE(),
        GrantedBy INT,
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
        FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID),
        FOREIGN KEY (GrantedBy) REFERENCES Employees(EmployeeID),
        UNIQUE (RoleID, PermissionID)
    );

    -- Create User-Role mapping
    CREATE TABLE UserRoles (
        UserRoleID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        RoleID INT NOT NULL,
        AssignedDate DATETIME2 DEFAULT GETDATE(),
        ExpiryDate DATETIME2 NULL, -- Optional role expiration
        AssignedBy INT,
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
        FOREIGN KEY (AssignedBy) REFERENCES Employees(EmployeeID),
        UNIQUE (UserID, RoleID)
    );

    -- Create User Permission Overrides (for exceptional cases)
    CREATE TABLE UserPermissionOverrides (
        OverrideID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        PermissionID INT NOT NULL,
        IsGranted BIT NOT NULL, -- TRUE = Grant, FALSE = Deny
        Reason NVARCHAR(500),
        ExpiryDate DATETIME2 NULL,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        CreatedBy INT,
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID),
        FOREIGN KEY (CreatedBy) REFERENCES Employees(EmployeeID),
        UNIQUE (UserID, PermissionID)
    );

    -- Create Audit Log for Permission Changes
    CREATE TABLE PermissionAuditLog (
        AuditID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        Action NVARCHAR(50) NOT NULL, -- ROLE_ASSIGNED, ROLE_REMOVED, PERMISSION_GRANTED, PERMISSION_DENIED
        TargetType NVARCHAR(50) NOT NULL, -- ROLE, PERMISSION
        TargetID INT NOT NULL, -- RoleID or PermissionID
        OldValue NVARCHAR(500),
        NewValue NVARCHAR(500),
        Reason NVARCHAR(500),
        IPAddress NVARCHAR(50),
        UserAgent NVARCHAR(500),
        ActionDate DATETIME2 DEFAULT GETDATE(),
        ActionBy INT,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (ActionBy) REFERENCES Employees(EmployeeID)
    );

    PRINT 'User Management tables created successfully.';
END
ELSE
BEGIN
    PRINT 'User Management tables already exist. Skipping creation.';
END
GO

-- =============================================
-- INSERT INITIAL DATA
-- =============================================

PRINT 'Inserting initial user management data...';

-- Insert Application Modules
IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'EMP')
BEGIN
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder) VALUES
    ('Employee Management', 'Manage employee profiles and information', 'EMP', 1),
    ('Position Management', 'Manage positions and job descriptions', 'POS', 2),
    ('Competency Management', 'Manage competencies, categories, and domains', 'COMP', 3),
    ('Assessment Management', 'Manage employee assessments and evaluations', 'ASSESS', 4),
    ('Development Planning', 'Manage employee development plans', 'DEV', 5),
    ('Company Management', 'Manage company and department structure', 'ORG', 6),
    ('Reports & Analytics', 'View reports and analytics', 'REPORT', 7),
    ('User Management', 'Manage users, roles, and permissions', 'USER', 8);
    
    PRINT 'Application modules inserted.';
END

-- Insert Permission Types
IF NOT EXISTS (SELECT 1 FROM PermissionTypes WHERE PermissionCode = 'C')
BEGIN
    INSERT INTO PermissionTypes (PermissionName, PermissionDescription, PermissionCode) VALUES
    ('Create', 'Create new records', 'C'),
    ('Read', 'View/read records', 'R'),
    ('Update', 'Modify existing records', 'U'),
    ('Delete', 'Delete records', 'D'),
    ('Approve', 'Approve assessments/plans', 'A'),
    ('Manage', 'Full management access', 'M');
    
    PRINT 'Permission types inserted.';
END

-- Create all Permission combinations (Module + Permission Type)
IF NOT EXISTS (SELECT 1 FROM Permissions)
BEGIN
    INSERT INTO Permissions (ModuleID, PermissionTypeID, Description)
    SELECT m.ModuleID, pt.PermissionTypeID, 
           CONCAT(pt.PermissionName, ' access to ', m.ModuleName)
    FROM ApplicationModules m
    CROSS JOIN PermissionTypes pt
    WHERE m.IsActive = 1 AND pt.IsActive = 1;
    
    PRINT 'Permissions created.';
END

-- Insert Default Roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'SYSADMIN')
BEGIN
    INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole) VALUES
    ('System Administrator', 'Full system access and administration', 'SYSADMIN', 1),
    ('HR Administrator', 'Human Resources administration', 'HRADMIN', 1),
    ('Department Manager', 'Department-level management access', 'DEPTMGR', 1),
    ('Team Lead', 'Team leadership access', 'TEAMLEAD', 1),
    ('Employee', 'Standard employee access', 'EMPLOYEE', 1),
    ('HR Specialist', 'HR specialist with limited admin access', 'HRSPEC', 1),
    ('Assessor', 'Assessment management access', 'ASSESSOR', 1),
    ('Read Only', 'Read-only access to most modules', 'READONLY', 1);
    
    PRINT 'Default roles inserted.';
END

-- =============================================
-- ASSIGN PERMISSIONS TO ROLES
-- =============================================

PRINT 'Assigning permissions to roles...';

-- System Administrator - All permissions
IF NOT EXISTS (SELECT 1 FROM RolePermissions rp 
               INNER JOIN Roles r ON rp.RoleID = r.RoleID 
               WHERE r.RoleCode = 'SYSADMIN')
BEGIN
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT r.RoleID, p.PermissionID
    FROM Roles r
    CROSS JOIN Permissions p
    WHERE r.RoleCode = 'SYSADMIN' AND p.IsActive = 1;
    
    PRINT 'System Administrator permissions assigned.';
END

-- HR Administrator - Full HR and Employee management, Read access to others
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT DISTINCT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'HRADMIN' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U', 'D', 'M'))
    OR (m.ModuleCode IN ('ASSESS', 'ORG', 'REPORT') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode = 'USER' AND pt.PermissionCode IN ('R', 'U'))
)
AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleID = r.RoleID AND PermissionID = p.PermissionID);

-- Department Manager - Manage department employees, positions, assessments
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT DISTINCT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'DEPTMGR' 
AND (
    (m.ModuleCode IN ('EMP', 'POS') AND pt.PermissionCode IN ('R', 'U'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U', 'A'))
    OR (m.ModuleCode IN ('COMP', 'ORG', 'REPORT') AND pt.PermissionCode IN ('R'))
)
AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleID = r.RoleID AND PermissionID = p.PermissionID);

-- Team Lead - Manage team assessments and development
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT DISTINCT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'TEAMLEAD' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U', 'A'))
    OR (m.ModuleCode = 'REPORT' AND pt.PermissionCode IN ('R'))
)
AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleID = r.RoleID AND PermissionID = p.PermissionID);

-- Employee - Self-service access
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT DISTINCT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'EMPLOYEE' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U'))
    OR (m.ModuleCode = 'REPORT' AND pt.PermissionCode IN ('R'))
)
AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleID = r.RoleID AND PermissionID = p.PermissionID);

-- HR Specialist - Limited HR access
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT DISTINCT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'HRSPEC' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('C', 'R', 'U'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV', 'ORG', 'REPORT') AND pt.PermissionCode IN ('R'))
)
AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleID = r.RoleID AND PermissionID = p.PermissionID);

-- Assessor - Assessment focused access
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT DISTINCT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'ASSESSOR' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode = 'ASSESS' AND pt.PermissionCode IN ('C', 'R', 'U', 'A'))
    OR (m.ModuleCode IN ('DEV', 'REPORT') AND pt.PermissionCode IN ('R'))
)
AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleID = r.RoleID AND PermissionID = p.PermissionID);

-- Read Only - Read access only
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT DISTINCT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'READONLY' 
AND pt.PermissionCode = 'R'
AND m.ModuleCode NOT IN ('USER') -- Exclude user management from read-only
AND NOT EXISTS (SELECT 1 FROM RolePermissions WHERE RoleID = r.RoleID AND PermissionID = p.PermissionID);

PRINT 'Role permissions assigned successfully.';

-- =============================================
-- CREATE SAMPLE USERS (Optional)
-- =============================================

PRINT 'Creating sample users from existing employees...';

-- Create Users for existing Employees (first 5 employees as examples)
-- Only create users for employees with valid email addresses or generate unique usernames
INSERT INTO Users (EmployeeID, Username, IsSystemAdmin)
SELECT TOP 5 
    e.EmployeeID,
    'employee' + CAST(e.EmployeeID AS VARCHAR(10)) + '@company.com', -- Always use employee ID format to avoid duplicates
    CASE WHEN e.EmployeeID = (SELECT MIN(EmployeeID) FROM Employees WHERE IsActive = 1) THEN 1 ELSE 0 END -- Make first employee system admin
FROM Employees e
WHERE e.IsActive = 1 
AND NOT EXISTS (SELECT 1 FROM Users WHERE EmployeeID = e.EmployeeID)
ORDER BY e.EmployeeID;

-- Assign default Employee role to all non-admin users
INSERT INTO UserRoles (UserID, RoleID, AssignedBy)
SELECT u.UserID, r.RoleID, 1 -- Assigned by EmployeeID 1
FROM Users u
CROSS JOIN Roles r
WHERE r.RoleCode = 'EMPLOYEE'
AND u.IsSystemAdmin = 0
AND NOT EXISTS (SELECT 1 FROM UserRoles WHERE UserID = u.UserID AND RoleID = r.RoleID);

PRINT 'Sample users created and assigned Employee role.';

PRINT 'User Management System setup completed successfully!';

-- =============================================
-- DISPLAY SUMMARY
-- =============================================

-- Get counts for summary
DECLARE @ModuleCount INT, @PermissionTypeCount INT, @TotalPermissions INT, @DefaultRoles INT, @UsersCreated INT;
SELECT @ModuleCount = COUNT(*) FROM ApplicationModules;
SELECT @PermissionTypeCount = COUNT(*) FROM PermissionTypes;
SELECT @TotalPermissions = COUNT(*) FROM Permissions;
SELECT @DefaultRoles = COUNT(*) FROM Roles WHERE IsSystemRole = 1;
SELECT @UsersCreated = COUNT(*) FROM Users;

PRINT '';
PRINT '=== USER MANAGEMENT SYSTEM SUMMARY ===';
PRINT 'Tables Created: 8';
PRINT 'Modules: ' + CAST(@ModuleCount AS VARCHAR(10));
PRINT 'Permission Types: ' + CAST(@PermissionTypeCount AS VARCHAR(10));
PRINT 'Total Permissions: ' + CAST(@TotalPermissions AS VARCHAR(10));
PRINT 'Default Roles: ' + CAST(@DefaultRoles AS VARCHAR(10));
PRINT 'Users Created: ' + CAST(@UsersCreated AS VARCHAR(10));
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Review and customize roles as needed';
PRINT '2. Assign appropriate roles to users';
PRINT '3. Implement permission checking in your application';
PRINT '4. Create user management UI';
PRINT '==========================================';
