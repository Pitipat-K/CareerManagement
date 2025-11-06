# Database Module Cleanup Guide

## Overview
This guide explains the cleanup of the ApplicationModules table to align with the granular permission system implemented on the frontend.

## Current State (Before Cleanup)

### Old Broad Modules (To Be Deleted)
These modules are too broad and don't match the granular frontend implementation:

| ModuleID | ModuleCode | ModuleName | Issue |
|----------|------------|------------|-------|
| 1 | EMP | Employee Management | Too broad - replaced by EMPLOYEES |
| 2 | POS | Position Management | Too broad - replaced by POSITIONS |
| 3 | COMP | Competency Management | Too broad - replaced by 5 specific modules |
| 4 | ASSESS | Assessment Management_ | Replaced by ASSESSMENTS |
| 5 | DEV | Development Planning | Too broad - replaced by 7 specific modules |
| 6 | ORG | Company Management | Too broad - replaced by COMPANIES |
| 7 | REPORT | Reports & Analytics | Replaced by REPORTS |
| 8 | USER | User Management | Too broad - replaced by 4 specific modules |

### Granular Modules (To Be Kept)
These modules match the frontend implementation:

#### Organization Management (100s)
| ModuleCode | ModuleName | DisplayOrder |
|------------|------------|--------------|
| EMPLOYEES | Employee Records Management | 101 |
| POSITIONS | Position Records Management | 102 |
| JOBFUNCTIONS | Job Function Management | 103 |
| DEPARTMENTS | Department Records Management | 104 |
| COMPANIES | Company Records Management | 105 |

#### Competency Management (200s)
| ModuleCode | ModuleName | DisplayOrder |
|------------|------------|--------------|
| COMPETENCIES | Individual Competencies | 201 |
| COMP_CATEGORIES | Competency Categories | 202 |
| COMP_DOMAINS | Competency Domains | 203 |
| COMP_SETS | Competency Sets | 204 |
| COMP_ASSIGN | Competency Assignment | 205 |

#### Employee Development (300s)
| ModuleCode | ModuleName | DisplayOrder |
|------------|------------|--------------|
| EMP_PROFILE | Employee Profile | 301 |
| COMP_ASSESSMENT | Competency Assessment | 302 |
| COMP_DASHBOARD | Competency Dashboard | 303 |
| DEV_PLAN | Development Plan Management | 304 |
| CAREER_NAV | Career Navigator | 305 |
| CAREER_PATH | Career Path Planning | 306 |
| ORG_COMPETENCY | Organization Competency View | 307 |

#### User Management (400s)
| ModuleCode | ModuleName | DisplayOrder |
|------------|------------|--------------|
| USERS | User Account Management | 401 |
| ROLES | Role Management | 402 |
| PERMISSIONS | Permission Management | 403 |
| AUDIT | Audit Log Management | 404 |

#### System Functions (500s)
| ModuleCode | ModuleName | DisplayOrder |
|------------|------------|--------------|
| REPORTS | Reports & Analytics Management | 501 |
| ASSESSMENTS | Assessment Management | 502 |
| IMPORT_DATA | Data Import Management | 503 |

## Cleanup Process

### Step 1: Run the Cleanup Script
```sql
-- Location: Career_Management.Server/Database_info/Cleanup_ApplicationModules.sql
```

The script will:
1. **Create a backup** of the ApplicationModules table
2. **Delete permissions** linked to old modules
3. **Delete old broad modules** (EMP, POS, COMP, etc.)
4. **Update display order** to ensure clean categorization
5. **Verify the cleanup** and show remaining modules

### Step 2: Recreate Permissions
After cleanup, you need to create permissions for the granular modules. You can use the script:
```sql
-- Location: Career_Management.Server/Database_info/Add_Granular_Permission_Modules_Fixed.sql
```

This will create all CRUD permissions (C, R, U, D, A, M) for each granular module.

### Step 3: Update User Roles
Assign the new granular permissions to your existing roles, or create new roles using the granular system.

## Frontend-Backend Mapping

### Frontend Component → Module Code Mapping

| Frontend Component | Module Code | Description |
|-------------------|-------------|-------------|
| Employees.tsx | EMPLOYEES | Employee records |
| Positions.tsx | POSITIONS | Position management |
| JobFunctions.tsx | JOBFUNCTIONS | Job functions |
| Departments.tsx | DEPARTMENTS | Departments |
| Companies.tsx | COMPANIES | Companies |
| Competencies.tsx | COMPETENCIES | Individual competencies |
| CompetencyCategories.tsx | COMP_CATEGORIES | Competency categories |
| CompetencyDomains.tsx | COMP_DOMAINS | Competency domains |
| CompetencySets.tsx | COMP_SETS | Competency sets |
| CompetencyAssign.tsx | COMP_ASSIGN | Competency assignment |
| UserManagement/UserList.tsx | USERS | User accounts |
| UserManagement/RoleManagement.tsx | ROLES | Roles |
| UserManagement/PermissionMatrix.tsx | PERMISSIONS | Permissions |
| UserManagement/AuditLog.tsx | AUDIT | Audit logs |

### Home Page Navigation → Module Code Mapping

| Menu Item | Module Code | Permission Required |
|-----------|-------------|-------------------|
| Employees | EMPLOYEES | R (Read) |
| Positions | POSITIONS | R (Read) |
| Job Functions | JOBFUNCTIONS | R (Read) |
| Departments | DEPARTMENTS | R (Read) |
| Companies | COMPANIES | R (Read) |
| Competencies | COMPETENCIES | R (Read) |
| Categories | COMP_CATEGORIES | R (Read) |
| Domains | COMP_DOMAINS | R (Read) |
| Sets | COMP_SETS | R (Read) |
| Assign | COMP_ASSIGN | R (Read) |
| Employee Development | EMP_PROFILE | R (Read) |
| Users | USERS | R (Read) |
| Roles | ROLES | R (Read) |
| Permissions | PERMISSIONS | R (Read) |
| Audit Log | AUDIT | R (Read) |
| Reports | REPORTS | R (Read) |
| Import Data | IMPORT_DATA | R (Read) |
| Assessments | ASSESSMENTS | R (Read) |

## Expected Results After Cleanup

### Before
- **42 modules** total (8 old + 24 granular + duplicates)
- **Inconsistent** module codes
- **Confusion** between broad and granular modules

### After
- **24 modules** total (only granular)
- **Consistent** naming and organization
- **Perfect alignment** with frontend implementation
- **Clean display order** (100s, 200s, 300s, 400s, 500s)

## Verification Checklist

After running the cleanup script:

- [ ] Old modules (EMP, POS, COMP, ASSESS, DEV, ORG, REPORT, USER) are deleted
- [ ] All 24 granular modules remain
- [ ] Display order is sequential (101-105, 201-205, 301-307, 401-404, 501-503)
- [ ] No duplicate module codes
- [ ] All modules are active (IsActive = 1)
- [ ] Permissions are created for each granular module
- [ ] Frontend loads without errors
- [ ] Menu items show/hide correctly based on permissions

## Rollback Plan

If you need to rollback:
```sql
-- Restore from backup
DROP TABLE ApplicationModules;
SELECT * INTO ApplicationModules FROM ApplicationModules_Backup;
```

## Next Steps

1. **Run the cleanup script** to remove old modules
2. **Create permissions** for granular modules (if not already done)
3. **Update user roles** to use new granular permissions
4. **Test the frontend** to ensure all menus work correctly
5. **Verify permission caching** is working properly
6. **Clean up backup tables** once everything is verified (optional)

## Support

If you encounter any issues:
1. Check the backup table: `ApplicationModules_Backup`
2. Review the cleanup script output for errors
3. Verify that permissions are properly linked to new modules
4. Check frontend console for permission-related errors
