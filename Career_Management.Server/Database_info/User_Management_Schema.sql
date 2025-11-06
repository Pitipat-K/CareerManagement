-- =============================================
-- User Management and Permission System
-- Career Management Application
-- =============================================

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
    PermissionFullName AS (CONCAT((SELECT ModuleCode FROM ApplicationModules WHERE ModuleID = Permissions.ModuleID), '_', (SELECT PermissionCode FROM PermissionTypes WHERE PermissionTypeID = Permissions.PermissionTypeID))),
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

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert Application Modules
INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder) VALUES
('Employee Management', 'Manage employee profiles and information', 'EMP', 1),
('Position Management', 'Manage positions and job descriptions', 'POS', 2),
('Competency Management', 'Manage competencies, categories, and domains', 'COMP', 3),
('Assessment Management', 'Manage employee assessments and evaluations', 'ASSESS', 4),
('Development Planning', 'Manage employee development plans', 'DEV', 5),
('Company Management', 'Manage company and department structure', 'ORG', 6),
('Reports & Analytics', 'View reports and analytics', 'REPORT', 7),
('User Management', 'Manage users, roles, and permissions', 'USER', 8);

-- Insert Permission Types
INSERT INTO PermissionTypes (PermissionName, PermissionDescription, PermissionCode) VALUES
('Create', 'Create new records', 'C'),
('Read', 'View/read records', 'R'),
('Update', 'Modify existing records', 'U'),
('Delete', 'Delete records', 'D'),
('Approve', 'Approve assessments/plans', 'A'),
('Manage', 'Full management access', 'M');

-- Create all Permission combinations (Module + Permission Type)
INSERT INTO Permissions (ModuleID, PermissionTypeID, Description)
SELECT m.ModuleID, pt.PermissionTypeID, 
       CONCAT(pt.PermissionName, ' access to ', m.ModuleName)
FROM ApplicationModules m
CROSS JOIN PermissionTypes pt
WHERE m.IsActive = 1 AND pt.IsActive = 1;

-- Insert Default Roles
INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole) VALUES
('System Administrator', 'Full system access and administration', 'SYSADMIN', 1),
('HR Administrator', 'Human Resources administration', 'HRADMIN', 1),
('Department Manager', 'Department-level management access', 'DEPTMGR', 1),
('Team Lead', 'Team leadership access', 'TEAMLEAD', 1),
('Employee', 'Standard employee access', 'EMPLOYEE', 1),
('HR Specialist', 'HR specialist with limited admin access', 'HRSPEC', 1),
('Assessor', 'Assessment management access', 'ASSESSOR', 1),
('Read Only', 'Read-only access to most modules', 'READONLY', 1);

-- =============================================
-- ASSIGN PERMISSIONS TO ROLES
-- =============================================

-- System Administrator - All permissions
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
WHERE r.RoleCode = 'SYSADMIN' AND p.IsActive = 1;

-- HR Administrator - Full HR and Employee management, Read access to others
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'HRADMIN' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U', 'D', 'M'))
    OR (m.ModuleCode IN ('ASSESS', 'ORG', 'REPORT') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode = 'USER' AND pt.PermissionCode IN ('R', 'U'))
);

-- Department Manager - Manage department employees, positions, assessments
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'DEPTMGR' 
AND (
    (m.ModuleCode IN ('EMP', 'POS') AND pt.PermissionCode IN ('R', 'U'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U', 'A'))
    OR (m.ModuleCode IN ('COMP', 'ORG', 'REPORT') AND pt.PermissionCode IN ('R'))
);

-- Team Lead - Manage team assessments and development
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'TEAMLEAD' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U', 'A'))
    OR (m.ModuleCode = 'REPORT' AND pt.PermissionCode IN ('R'))
);

-- Employee - Self-service access
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'EMPLOYEE' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV') AND pt.PermissionCode IN ('C', 'R', 'U'))
    OR (m.ModuleCode = 'REPORT' AND pt.PermissionCode IN ('R'))
);

-- HR Specialist - Limited HR access
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'HRSPEC' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('C', 'R', 'U'))
    OR (m.ModuleCode IN ('ASSESS', 'DEV', 'ORG', 'REPORT') AND pt.PermissionCode IN ('R'))
);

-- Assessor - Assessment focused access
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'ASSESSOR' 
AND (
    (m.ModuleCode IN ('EMP', 'POS', 'COMP') AND pt.PermissionCode IN ('R'))
    OR (m.ModuleCode = 'ASSESS' AND pt.PermissionCode IN ('C', 'R', 'U', 'A'))
    OR (m.ModuleCode IN ('DEV', 'REPORT') AND pt.PermissionCode IN ('R'))
);

-- Read Only - Read access only
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT r.RoleID, p.PermissionID
FROM Roles r
CROSS JOIN Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE r.RoleCode = 'READONLY' 
AND pt.PermissionCode = 'R'
AND m.ModuleCode NOT IN ('USER'); -- Exclude user management from read-only

-- =============================================
-- CREATE HELPFUL VIEWS
-- =============================================

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
        p.PermissionFullName,
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
        p.PermissionFullName,
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

-- View for user role summary
CREATE VIEW vw_UserRoleSummary AS
SELECT 
    u.UserID,
    u.EmployeeID,
    u.Username,
    e.FirstName + ' ' + e.LastName AS FullName,
    e.Email,
    d.DepartmentName,
    p.PositionTitle,
    STRING_AGG(r.RoleName, ', ') AS Roles,
    COUNT(DISTINCT ur.RoleID) AS RoleCount,
    u.IsSystemAdmin,
    u.LastLoginDate,
    u.IsActive
FROM Users u
INNER JOIN Employees e ON u.EmployeeID = e.EmployeeID
LEFT JOIN Positions pos ON e.PositionID = pos.PositionID
LEFT JOIN Departments d ON pos.DepartmentID = d.DepartmentID
LEFT JOIN UserRoles ur ON u.UserID = ur.UserID AND ur.IsActive = 1
LEFT JOIN Roles r ON ur.RoleID = r.RoleID AND r.IsActive = 1
WHERE u.IsActive = 1
GROUP BY u.UserID, u.EmployeeID, u.Username, e.FirstName, e.LastName, 
         e.Email, d.DepartmentName, p.PositionTitle, u.IsSystemAdmin, 
         u.LastLoginDate, u.IsActive;

-- =============================================
-- CREATE PERMISSION CHECK FUNCTIONS
-- =============================================

-- Function to check if user has specific permission
CREATE FUNCTION fn_HasPermission(@UserID INT, @ModuleCode VARCHAR(50), @PermissionCode VARCHAR(20))
RETURNS BIT
AS
BEGIN
    DECLARE @HasPermission BIT = 0;
    
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
