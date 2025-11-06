-- =============================================
-- Granular Permission System Implementation
-- Add New Specific Modules for Each Menu Item
-- =============================================

USE [CareerManagement]; -- Replace with your actual database name
GO

-- =============================================
-- STEP 1: Add New Granular Application Modules
-- =============================================

PRINT 'Adding new granular application modules...'

-- Organization Management Modules
INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
('Employee Management', 'Manage individual employee records and information', 'EMPLOYEES', 101, 1),
('Position Management', 'Manage job positions and position details', 'POSITIONS', 102, 1),
('Job Function Management', 'Manage job functions and classifications', 'JOBFUNCTIONS', 103, 1),
('Department Management', 'Manage organizational departments', 'DEPARTMENTS', 104, 1),
('Company Management', 'Manage company information and structure', 'COMPANIES', 105, 1);

-- Competency Management Modules  
INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
('Competency Management', 'Manage individual competencies', 'COMPETENCIES', 201, 1),
('Competency Categories', 'Manage competency category structure', 'COMP_CATEGORIES', 202, 1),
('Competency Domains', 'Manage competency domain organization', 'COMP_DOMAINS', 203, 1),
('Competency Sets', 'Manage competency set collections', 'COMP_SETS', 204, 1),
('Competency Assignment', 'Assign competencies to positions and employees', 'COMP_ASSIGN', 205, 1);

-- Employee Development Modules
INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
('Employee Profile', 'View and manage employee profile information', 'EMP_PROFILE', 301, 1),
('Competency Assessment', 'Conduct and manage competency assessments', 'COMP_ASSESSMENT', 302, 1),
('Competency Dashboard', 'View competency analytics and dashboards', 'COMP_DASHBOARD', 303, 1),
('Development Planning', 'Create and manage employee development plans', 'DEV_PLAN', 304, 1),
('Career Navigator', 'Navigate career paths and opportunities', 'CAREER_NAV', 305, 1),
('Career Path Planning', 'Plan and visualize career progression paths', 'CAREER_PATH', 306, 1),
('Organization Competency View', 'View organization-wide competency information', 'ORG_COMPETENCY', 307, 1);

-- User Management Modules
INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
('User Management', 'Manage system users and accounts', 'USERS', 401, 1),
('Role Management', 'Manage user roles and role assignments', 'ROLES', 402, 1),
('Permission Management', 'Manage permissions and permission matrix', 'PERMISSIONS', 403, 1),
('Audit Log Management', 'View and manage system audit logs', 'AUDIT', 404, 1);

-- System Modules
INSERT INTO ApplicationModules (ModuleName, ModuleDescription, ModuleCode, DisplayOrder, IsActive) VALUES
('Reports & Analytics', 'Generate reports and view analytics', 'REPORTS', 501, 1),
('Assessment Management', 'Manage assessment processes and evaluations', 'ASSESSMENTS', 502, 1),
('Data Import', 'Import data from external sources', 'IMPORT_DATA', 503, 1);

PRINT 'New granular modules added successfully.'

-- =============================================
-- STEP 2: Create Permissions for New Modules
-- =============================================

PRINT 'Creating permissions for new granular modules...'

-- Create all permission combinations (Module + Permission Type)
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
-- STEP 3: Create Migration Mapping Table
-- =============================================

PRINT 'Creating module migration mapping...'

-- Create temporary table to map old modules to new modules
IF OBJECT_ID('tempdb..#ModuleMigrationMapping') IS NOT NULL DROP TABLE #ModuleMigrationMapping;

CREATE TABLE #ModuleMigrationMapping (
    OldModuleCode NVARCHAR(50),
    NewModuleCode NVARCHAR(50),
    Description NVARCHAR(200)
);

-- Define the mapping from old broad modules to new granular modules
INSERT INTO #ModuleMigrationMapping (OldModuleCode, NewModuleCode, Description) VALUES
-- Employee Management -> Multiple modules
('EMP', 'EMPLOYEES', 'Employee data management'),
('EMP', 'EMP_PROFILE', 'Employee profile access'),
('EMP', 'IMPORT_DATA', 'Employee data import'),

-- Position Management -> Position modules  
('POS', 'POSITIONS', 'Position management'),
('POS', 'JOBFUNCTIONS', 'Job function management'),

-- Competency Management -> Multiple competency modules
('COMP', 'COMPETENCIES', 'Individual competency management'),
('COMP', 'COMP_CATEGORIES', 'Competency category management'),
('COMP', 'COMP_DOMAINS', 'Competency domain management'),
('COMP', 'COMP_SETS', 'Competency set management'),
('COMP', 'COMP_ASSIGN', 'Competency assignment'),
('COMP', 'COMP_ASSESSMENT', 'Competency assessment'),
('COMP', 'COMP_DASHBOARD', 'Competency dashboard'),
('COMP', 'ORG_COMPETENCY', 'Organization competency view'),

-- Assessment Management
('ASSESS', 'ASSESSMENTS', 'Assessment management'),
('ASSESS', 'COMP_ASSESSMENT', 'Competency assessment'),

-- Development Planning -> Development modules
('DEV', 'DEV_PLAN', 'Development planning'),
('DEV', 'CAREER_NAV', 'Career navigation'),
('DEV', 'CAREER_PATH', 'Career path planning'),

-- Company Management -> Organization modules
('ORG', 'COMPANIES', 'Company management'),
('ORG', 'DEPARTMENTS', 'Department management'),

-- Reports & Analytics
('REPORT', 'REPORTS', 'Reports and analytics'),

-- User Management -> User modules
('USER', 'USERS', 'User account management'),
('USER', 'ROLES', 'Role management'),
('USER', 'PERMISSIONS', 'Permission management'),
('USER', 'AUDIT', 'Audit log management');

PRINT 'Module migration mapping created.'

-- =============================================
-- STEP 4: Create Default Granular Roles
-- =============================================

PRINT 'Creating new granular roles...'

-- Create specific roles using new granular permissions
DECLARE @RoleID INT;

-- HR Data Entry Role
INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
VALUES ('HR Data Entry', 'Can manage employee data and view organizational structure', 'HR_DATA_ENTRY', 0, 1);
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

-- Competency Specialist Role
INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
VALUES ('Competency Specialist', 'Full access to competency structure management', 'COMP_SPECIALIST', 0, 1);
SET @RoleID = SCOPE_IDENTITY();

-- Add permissions for Competency Specialist (All competency structure modules)
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT @RoleID, p.PermissionID
FROM Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
WHERE m.ModuleCode IN ('COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS');

-- Employee Development Manager Role
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

-- Department Manager Role
INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
VALUES ('Department Manager', 'View team development and competency data', 'DEPT_MANAGER', 0, 1);
SET @RoleID = SCOPE_IDENTITY();

-- Add permissions for Department Manager (Read-only access to development data)
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT @RoleID, p.PermissionID
FROM Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
INNER JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
WHERE m.ModuleCode IN ('EMPLOYEES', 'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'ORG_COMPETENCY', 'REPORTS')
AND pt.PermissionCode = 'R';

-- User Administrator Role
INSERT INTO Roles (RoleName, RoleDescription, RoleCode, IsSystemRole, IsActive) 
VALUES ('User Administrator', 'Manage users, roles, and permissions', 'USER_ADMIN', 0, 1);
SET @RoleID = SCOPE_IDENTITY();

-- Add permissions for User Administrator
INSERT INTO RolePermissions (RoleID, PermissionID)
SELECT @RoleID, p.PermissionID
FROM Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
WHERE m.ModuleCode IN ('USERS', 'ROLES', 'PERMISSIONS', 'AUDIT');

-- Read Only Employee Role
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

PRINT 'New granular roles created successfully.'

-- =============================================
-- STEP 5: Display Summary
-- =============================================

PRINT '==========================================='
PRINT 'GRANULAR PERMISSION SYSTEM SETUP COMPLETE'
PRINT '==========================================='

-- Show new modules created
PRINT 'New Modules Created:'
SELECT ModuleCode, ModuleName, DisplayOrder
FROM ApplicationModules 
WHERE ModuleCode IN (
    'EMPLOYEES', 'POSITIONS', 'JOBFUNCTIONS', 'DEPARTMENTS', 'COMPANIES',
    'COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS', 'COMP_ASSIGN',
    'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY',
    'USERS', 'ROLES', 'PERMISSIONS', 'AUDIT',
    'REPORTS', 'ASSESSMENTS', 'IMPORT_DATA'
)
ORDER BY DisplayOrder;

-- Show new permissions count
PRINT 'Total New Permissions Created:'
SELECT COUNT(*) as NewPermissionCount
FROM Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
WHERE m.ModuleCode IN (
    'EMPLOYEES', 'POSITIONS', 'JOBFUNCTIONS', 'DEPARTMENTS', 'COMPANIES',
    'COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS', 'COMP_ASSIGN',
    'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY',
    'USERS', 'ROLES', 'PERMISSIONS', 'AUDIT',
    'REPORTS', 'ASSESSMENTS', 'IMPORT_DATA'
);

-- Show new roles created
PRINT 'New Granular Roles Created:'
SELECT RoleCode, RoleName, RoleDescription
FROM Roles 
WHERE RoleCode IN ('HR_DATA_ENTRY', 'COMP_SPECIALIST', 'DEV_MANAGER', 'DEPT_MANAGER', 'USER_ADMIN', 'EMP_READONLY')
ORDER BY RoleCode;

PRINT '==========================================='
PRINT 'NEXT STEPS:'
PRINT '1. Update frontend components to use new module codes'
PRINT '2. Update navigation menus with granular permissions'
PRINT '3. Test all permission combinations'
PRINT '4. Migrate existing user roles to new granular permissions'
PRINT '5. Optionally deactivate old broad modules after migration'
PRINT '==========================================='

-- Clean up temporary table
DROP TABLE #ModuleMigrationMapping;

GO
