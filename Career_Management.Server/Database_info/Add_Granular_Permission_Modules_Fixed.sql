-- =============================================
-- Granular Permission System Implementation (Fixed)
-- Add New Specific Modules for Each Menu Item
-- Handles Existing Modules Properly
-- =============================================

USE [CareerManagement]; -- Replace with your actual database name
GO

-- =============================================
-- STEP 1: Add New Granular Application Modules (With Duplicate Check)
-- =============================================

PRINT 'Adding new granular application modules (checking for duplicates)...'

-- Organization Management Modules
IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'EMPLOYEES')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Employee Records Management', 'Manage individual employee records and information', 'EMPLOYEES', 101, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'POSITIONS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Position Records Management', 'Manage job positions and position details', 'POSITIONS', 102, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'JOBFUNCTIONS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Job Function Management', 'Manage job functions and classifications', 'JOBFUNCTIONS', 103, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'DEPARTMENTS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Department Records Management', 'Manage organizational departments', 'DEPARTMENTS', 104, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMPANIES')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Company Records Management', 'Manage company information and structure', 'COMPANIES', 105, 1);

-- Competency Management Modules  
IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMPETENCIES')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Individual Competencies', 'Manage individual competencies', 'COMPETENCIES', 201, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMP_CATEGORIES')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Competency Categories', 'Manage competency category structure', 'COMP_CATEGORIES', 202, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMP_DOMAINS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Competency Domains', 'Manage competency domain organization', 'COMP_DOMAINS', 203, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMP_SETS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Competency Sets', 'Manage competency set collections', 'COMP_SETS', 204, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMP_ASSIGN')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Competency Assignment', 'Assign competencies to positions and employees', 'COMP_ASSIGN', 205, 1);

-- Employee Development Modules
IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'EMP_PROFILE')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Employee Profile', 'View and manage employee profile information', 'EMP_PROFILE', 301, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMP_ASSESSMENT')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Competency Assessment', 'Conduct and manage competency assessments', 'COMP_ASSESSMENT', 302, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'COMP_DASHBOARD')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Competency Dashboard', 'View competency analytics and dashboards', 'COMP_DASHBOARD', 303, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'DEV_PLAN')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Development Plan Management', 'Create and manage employee development plans', 'DEV_PLAN', 304, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'CAREER_NAV')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Career Navigator', 'Navigate career paths and opportunities', 'CAREER_NAV', 305, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'CAREER_PATH')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Career Path Planning', 'Plan and visualize career progression paths', 'CAREER_PATH', 306, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'ORG_COMPETENCY')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Organization Competency View', 'View organization-wide competency information', 'ORG_COMPETENCY', 307, 1);

-- User Management Modules
IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'USERS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('User Account Management', 'Manage system users and accounts', 'USERS', 401, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'ROLES')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Role Management', 'Manage user roles and role assignments', 'ROLES', 402, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'PERMISSIONS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Permission Management', 'Manage permissions and permission matrix', 'PERMISSIONS', 403, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'AUDIT')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Audit Log Management', 'View and manage system audit logs', 'AUDIT', 404, 1);

-- System Modules
IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'REPORTS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Reports & Analytics Management', 'Generate reports and view analytics', 'REPORTS', 501, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'ASSESSMENTS')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Assessment Management', 'Manage assessment processes and evaluations', 'ASSESSMENTS', 502, 1);

IF NOT EXISTS (SELECT 1 FROM ApplicationModules WHERE ModuleCode = 'IMPORT_DATA')
    INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
    ('Data Import Management', 'Import data from external sources', 'IMPORT_DATA', 503, 1);

PRINT 'New granular modules added successfully (duplicates skipped).'

-- =============================================
-- STEP 2: Create Permissions for New Modules
-- =============================================

PRINT 'Creating permissions for new granular modules...'

-- Create all permission combinations (Module + Permission Type) for new modules only
INSERT INTO Permissions (ModuleID, PermissionTypeID, Description)
SELECT 
    m.ModuleID, 
    pt.PermissionTypeID, 
    CONCAT(pt.PermissionName, ' access to ', m.ModuleName)
FROM ApplicationModules m
CROSS JOIN PermissionTypes pt
WHERE m.ModuleCode IN (
    'EMPLOYEES', 'POSITIONS', 'JOBFUNCTIONS', 'DEPARTMENTS', 'COMPANIES',
    'COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS', 'COMP_ASSIGN',
    'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY',
    'USERS', 'ROLES', 'PERMISSIONS', 'AUDIT',
    'REPORTS', 'ASSESSMENTS', 'IMPORT_DATA'
)
AND m.IsActive = 1 
AND pt.IsActive = 1
AND NOT EXISTS (
    SELECT 1 FROM Permissions p2 
    WHERE p2.ModuleID = m.ModuleID 
    AND p2.PermissionTypeID = pt.PermissionTypeID
);

PRINT 'Permissions created for new granular modules.'

-- =============================================
-- STEP 3: Create New Granular Roles (With Duplicate Check)
-- =============================================

PRINT 'Creating new granular roles (checking for duplicates)...'

DECLARE @RoleID INT;

-- HR Data Entry Role
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'HR_DATA_ENTRY')
BEGIN
    INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
    VALUES ('HR Data Entry Clerk', 'Can manage employee data and view organizational structure', 'HR_DATA_ENTRY', 0, 1);
    SET @RoleID = SCOPE_IDENTITY();

    -- Add permissions for HR Data Entry (Employee CRUD, Position/Department Read)
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @RoleID, p.PermissionID
    FROM Permissions p
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
    INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
    WHERE (
        (m.ModuleCode = 'EMPLOYEES' AND pt.PermissionCode IN ('C', 'R', 'U', 'D')) OR
        (m.ModuleCode = 'POSITIONS' AND pt.PermissionCode = 'R') OR
        (m.ModuleCode = 'DEPARTMENTS' AND pt.PermissionCode = 'R') OR
        (m.ModuleCode = 'COMPANIES' AND pt.PermissionCode = 'R')
    );
    PRINT 'HR Data Entry Clerk role created.';
END
ELSE
    PRINT 'HR Data Entry Clerk role already exists.';

-- Competency Specialist Role
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'COMP_SPECIALIST')
BEGIN
    INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
    VALUES ('Competency Specialist', 'Full access to competency structure management', 'COMP_SPECIALIST', 0, 1);
    SET @RoleID = SCOPE_IDENTITY();

    -- Add permissions for Competency Specialist (All competency structure modules)
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @RoleID, p.PermissionID
    FROM Permissions p
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
    WHERE m.ModuleCode IN ('COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS');
    PRINT 'Competency Specialist role created.';
END
ELSE
    PRINT 'Competency Specialist role already exists.';

-- Employee Development Manager Role
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'DEV_MANAGER')
BEGIN
    INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
    VALUES ('Development Manager', 'Manage employee development and career planning', 'DEV_MANAGER', 0, 1);
    SET @RoleID = SCOPE_IDENTITY();

    -- Add permissions for Development Manager
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @RoleID, p.PermissionID
    FROM Permissions p
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
    INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
    WHERE (
        (m.ModuleCode IN ('EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH') AND pt.PermissionCode IN ('C', 'R', 'U')) OR
        (m.ModuleCode = 'EMPLOYEES' AND pt.PermissionCode = 'R') OR
        (m.ModuleCode = 'ORG_COMPETENCY' AND pt.PermissionCode = 'R')
    );
    PRINT 'Development Manager role created.';
END
ELSE
    PRINT 'Development Manager role already exists.';

-- Department Manager Role (with different code to avoid duplicate)
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'DEPT_MANAGER_V2')
BEGIN
    INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
    VALUES ('Department Manager V2', 'View team development and competency data', 'DEPT_MANAGER_V2', 0, 1);
    SET @RoleID = SCOPE_IDENTITY();

    -- Add permissions for Department Manager (Read-only access to development data)
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @RoleID, p.PermissionID
    FROM Permissions p
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
    INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
    WHERE m.ModuleCode IN ('EMPLOYEES', 'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'ORG_COMPETENCY', 'REPORTS')
    AND pt.PermissionCode = 'R';
    PRINT 'Department Manager V2 role created.';
END
ELSE
    PRINT 'Department Manager V2 role already exists.';

-- User Administrator Role
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'USER_ADMIN')
BEGIN
    INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
    VALUES ('User Administrator', 'Manage users, roles, and permissions', 'USER_ADMIN', 0, 1);
    SET @RoleID = SCOPE_IDENTITY();

    -- Add permissions for User Administrator
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @RoleID, p.PermissionID
    FROM Permissions p
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
    WHERE m.ModuleCode IN ('USERS', 'ROLES', 'PERMISSIONS', 'AUDIT');
    PRINT 'User Administrator role created.';
END
ELSE
    PRINT 'User Administrator role already exists.';

-- Read Only Employee Role
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleCode = 'EMP_READONLY')
BEGIN
    INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
    VALUES ('Employee Read Only', 'Self-service access to view own development data', 'EMP_READONLY', 0, 1);
    SET @RoleID = SCOPE_IDENTITY();

    -- Add permissions for Employee Read Only
    INSERT INTO RolePermissions (RoleID, PermissionID)
    SELECT @RoleID, p.PermissionID
    FROM Permissions p
    INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
    INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
    WHERE m.ModuleCode IN ('EMP_PROFILE', 'COMP_DASHBOARD', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY')
    AND pt.PermissionCode = 'R';
    PRINT 'Employee Read Only role created.';
END
ELSE
    PRINT 'Employee Read Only role already exists.';

PRINT 'New granular roles creation completed.'

-- =============================================
-- STEP 4: Display Summary
-- =============================================

PRINT '==========================================='
PRINT 'GRANULAR PERMISSION SYSTEM SETUP COMPLETE'
PRINT '==========================================='

-- Show new modules created
PRINT 'New Granular Modules Available:'
SELECT ModuleCode, ModuleName, DisplayOrder, 
       CASE WHEN CreatedDate >= CAST(GETDATE() AS DATE) THEN 'NEW' ELSE 'EXISTING' END as Status
FROM ApplicationModules 
WHERE ModuleCode IN (
    'EMPLOYEES', 'POSITIONS', 'JOBFUNCTIONS', 'DEPARTMENTS', 'COMPANIES',
    'COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS', 'COMP_ASSIGN',
    'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY',
    'USERS', 'ROLES', 'PERMISSIONS', 'AUDIT',
    'REPORTS', 'ASSESSMENTS', 'IMPORT_DATA'
)
ORDER BY DisplayOrder;

-- Show permissions count for new modules
PRINT 'Permissions Available for New Modules:'
SELECT m.ModuleCode, COUNT(p.PermissionID) as PermissionCount
FROM ApplicationModules m
LEFT JOIN Permissions p ON m.ModuleID = p.ModuleID
WHERE m.ModuleCode IN (
    'EMPLOYEES', 'POSITIONS', 'JOBFUNCTIONS', 'DEPARTMENTS', 'COMPANIES',
    'COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS', 'COMP_ASSIGN',
    'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY',
    'USERS', 'ROLES', 'PERMISSIONS', 'AUDIT',
    'REPORTS', 'ASSESSMENTS', 'IMPORT_DATA'
)
GROUP BY m.ModuleCode, m.DisplayOrder
ORDER BY m.DisplayOrder;

-- Show granular roles available
PRINT 'Granular Roles Available:'
SELECT RoleCode, RoleName, 
       (SELECT COUNT(*) FROM RolePermissions rp WHERE rp.RoleID = r.RoleID) as PermissionCount
FROM Roles r
WHERE RoleCode IN ('HR_DATA_ENTRY', 'COMP_SPECIALIST', 'DEV_MANAGER', 'DEPT_MANAGER_V2', 'USER_ADMIN', 'EMP_READONLY')
ORDER BY RoleCode;

PRINT '==========================================='
PRINT 'SUCCESS! Granular permission system is now ready.'
PRINT 'You can now update your frontend to use specific module codes.'
PRINT '==========================================='

GO
