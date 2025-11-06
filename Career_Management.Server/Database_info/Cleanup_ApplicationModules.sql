-- =============================================
-- Cleanup ApplicationModules Table
-- Remove old broad modules and keep only granular modules
-- that match the frontend permission control
-- =============================================

USE [CareerManagement];
GO

PRINT '=========================================='
PRINT 'CLEANING UP APPLICATION MODULES'
PRINT '=========================================='

-- First, let's see what will be affected
PRINT ''
PRINT 'Modules to be DELETED (old broad modules):'
SELECT ModuleID, ModuleCode, ModuleName
FROM ApplicationModules
WHERE ModuleCode IN ('EMP', 'POS', 'COMP', 'ASSESS', 'DEV', 'ORG', 'REPORT', 'USER')
ORDER BY ModuleID;

PRINT ''
PRINT 'Modules to be KEPT (granular modules):'
SELECT ModuleID, ModuleCode, ModuleName
FROM ApplicationModules
WHERE ModuleCode IN (
    'EMPLOYEES', 'POSITIONS', 'JOBFUNCTIONS', 'DEPARTMENTS', 'COMPANIES',
    'COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS', 'COMP_ASSIGN',
    'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY',
    'USERS', 'ROLES', 'PERMISSIONS', 'AUDIT',
    'REPORTS', 'ASSESSMENTS', 'IMPORT_DATA'
)
ORDER BY DisplayOrder;

-- =============================================
-- STEP 1: Backup affected data (optional but recommended)
-- =============================================
PRINT ''
PRINT 'Step 1: Creating backup of permissions that will be affected...'

-- Create a backup table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApplicationModules_Backup')
BEGIN
    SELECT * 
    INTO ApplicationModules_Backup
    FROM ApplicationModules;
    PRINT '✅ Backup table ApplicationModules_Backup created'
END
ELSE
BEGIN
    PRINT '⚠️ Backup table already exists, skipping backup creation'
END

-- =============================================
-- STEP 2: Handle related data in Permissions table
-- =============================================
PRINT ''
PRINT 'Step 2: Checking for permissions using old modules...'

DECLARE @PermissionsToDelete INT;
SELECT @PermissionsToDelete = COUNT(*)
FROM Permissions p
INNER JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
WHERE m.ModuleCode IN ('EMP', 'POS', 'COMP', 'ASSESS', 'DEV', 'ORG', 'REPORT', 'USER');

PRINT 'Found ' + CAST(@PermissionsToDelete AS VARCHAR) + ' permissions linked to old modules'

-- Delete permissions linked to old modules
IF @PermissionsToDelete > 0
BEGIN
    PRINT 'Deleting permissions linked to old modules...'
    
    DELETE FROM Permissions
    WHERE ModuleID IN (
        SELECT ModuleID 
        FROM ApplicationModules 
        WHERE ModuleCode IN ('EMP', 'POS', 'COMP', 'ASSESS', 'DEV', 'ORG', 'REPORT', 'USER')
    );
    
    PRINT '✅ Deleted ' + CAST(@PermissionsToDelete AS VARCHAR) + ' permissions'
END

-- =============================================
-- STEP 3: Delete old broad modules
-- =============================================
PRINT ''
PRINT 'Step 3: Deleting old broad modules...'

DELETE FROM ApplicationModules
WHERE ModuleCode IN ('EMP', 'POS', 'COMP', 'ASSESS', 'DEV', 'ORG', 'REPORT', 'USER');

PRINT '✅ Old modules deleted successfully'

-- =============================================
-- STEP 4: Fix display order for remaining modules
-- =============================================
PRINT ''
PRINT 'Step 4: Updating display order for clean sequence...'

-- The display order is already good (101-105, 201-205, 301-307, 401-404, 501-503)
-- Just verify it's correct
UPDATE ApplicationModules 
SET DisplayOrder = CASE ModuleCode
    -- Organization Management (100s)
    WHEN 'EMPLOYEES' THEN 101
    WHEN 'POSITIONS' THEN 102
    WHEN 'JOBFUNCTIONS' THEN 103
    WHEN 'DEPARTMENTS' THEN 104
    WHEN 'COMPANIES' THEN 105
    
    -- Competency Management (200s)
    WHEN 'COMPETENCIES' THEN 201
    WHEN 'COMP_CATEGORIES' THEN 202
    WHEN 'COMP_DOMAINS' THEN 203
    WHEN 'COMP_SETS' THEN 204
    WHEN 'COMP_ASSIGN' THEN 205
    
    -- Employee Development (300s)
    WHEN 'EMP_PROFILE' THEN 301
    WHEN 'COMP_ASSESSMENT' THEN 302
    WHEN 'COMP_DASHBOARD' THEN 303
    WHEN 'DEV_PLAN' THEN 304
    WHEN 'CAREER_NAV' THEN 305
    WHEN 'CAREER_PATH' THEN 306
    WHEN 'ORG_COMPETENCY' THEN 307
    
    -- User Management (400s)
    WHEN 'USERS' THEN 401
    WHEN 'ROLES' THEN 402
    WHEN 'PERMISSIONS' THEN 403
    WHEN 'AUDIT' THEN 404
    
    -- System Functions (500s)
    WHEN 'REPORTS' THEN 501
    WHEN 'ASSESSMENTS' THEN 502
    WHEN 'IMPORT_DATA' THEN 503
    
    ELSE DisplayOrder
END
WHERE ModuleCode IN (
    'EMPLOYEES', 'POSITIONS', 'JOBFUNCTIONS', 'DEPARTMENTS', 'COMPANIES',
    'COMPETENCIES', 'COMP_CATEGORIES', 'COMP_DOMAINS', 'COMP_SETS', 'COMP_ASSIGN',
    'EMP_PROFILE', 'COMP_ASSESSMENT', 'COMP_DASHBOARD', 'DEV_PLAN', 'CAREER_NAV', 'CAREER_PATH', 'ORG_COMPETENCY',
    'USERS', 'ROLES', 'PERMISSIONS', 'AUDIT',
    'REPORTS', 'ASSESSMENTS', 'IMPORT_DATA'
);

PRINT '✅ Display order updated'

-- =============================================
-- STEP 5: Verify the cleanup
-- =============================================
PRINT ''
PRINT '=========================================='
PRINT 'CLEANUP VERIFICATION'
PRINT '=========================================='

PRINT ''
PRINT 'Remaining modules in the system:'
SELECT 
    ModuleCode,
    ModuleName,
    DisplayOrder,
    CASE 
        WHEN DisplayOrder BETWEEN 101 AND 199 THEN 'Organization Management'
        WHEN DisplayOrder BETWEEN 201 AND 299 THEN 'Competency Management'
        WHEN DisplayOrder BETWEEN 301 AND 399 THEN 'Employee Development'
        WHEN DisplayOrder BETWEEN 401 AND 499 THEN 'User Management'
        WHEN DisplayOrder BETWEEN 501 AND 599 THEN 'System Functions'
        ELSE 'Other'
    END AS Category,
    IsActive
FROM ApplicationModules
WHERE IsActive = 1
ORDER BY DisplayOrder;

PRINT ''
DECLARE @ModuleCount INT;
SELECT @ModuleCount = COUNT(*) FROM ApplicationModules WHERE IsActive = 1;
PRINT 'Total active modules: ' + CAST(@ModuleCount AS VARCHAR)

PRINT ''
PRINT 'Permissions per module:'
SELECT 
    m.ModuleCode,
    m.ModuleName,
    COUNT(p.PermissionID) AS PermissionCount
FROM ApplicationModules m
LEFT JOIN Permissions p ON m.ModuleID = p.ModuleID
WHERE m.IsActive = 1
GROUP BY m.ModuleCode, m.ModuleName, m.DisplayOrder
ORDER BY m.DisplayOrder;

PRINT ''
PRINT '=========================================='
PRINT 'CLEANUP COMPLETE!'
PRINT '=========================================='
PRINT ''
PRINT 'Summary of changes:'
PRINT '- Deleted old broad modules (EMP, POS, COMP, ASSESS, DEV, ORG, REPORT, USER)'
PRINT '- Kept granular modules that match frontend implementation'
PRINT '- Updated display order for clean categorization'
PRINT ''
PRINT 'Next steps:'
PRINT '1. Verify the remaining modules match your frontend'
PRINT '2. Create new permissions for granular modules if needed'
PRINT '3. Assign permissions to roles'
PRINT '4. Test the frontend with the cleaned-up modules'
PRINT '=========================================='

GO

