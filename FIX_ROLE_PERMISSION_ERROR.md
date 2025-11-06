# Fix Role Permission Update Error

## Problem
When editing role permissions, you get a **500 Internal Server Error**. This happens because:
1. The cleanup script deleted old modules (EMP, POS, COMP, etc.)
2. Permissions linked to those modules were also deleted
3. But roles still have `RolePermissions` entries pointing to those deleted permissions
4. When you try to save role permissions, the system tries to validate these orphaned permissions

## Solution

### Step 1: Run the Orphaned Permissions Cleanup Script

**From PowerShell (in the Career_Management folder):**
```powershell
cd Career_Management.Server
sqlcmd -S localhost\SQLEXPRESS -d CareerManagement -i Database_info\Fix_Orphaned_RolePermissions.sql
```

**Or from SQL Server Management Studio:**
1. Open `Fix_Orphaned_RolePermissions.sql`
2. Execute the script

### Step 2: Restart the Backend Server

After cleaning up orphaned permissions:
```powershell
# Stop the current server (Ctrl+C if running)
# Then restart it
dotnet run
```

### Step 3: Clear Browser Cache and Reload

In your browser:
1. Press `Ctrl+F5` to hard refresh
2. Or clear browser cache
3. Logout and login again to refresh permission cache

### Step 4: Reassign Permissions to Roles

Now you need to assign the new granular permissions to your roles:

1. Go to **User Management → Roles**
2. For each role, click **Edit** (pencil icon)
3. Select the appropriate **new granular permissions**:

#### Example Permission Mapping:

**Old Permission → New Granular Permissions**

| Old Module | New Granular Modules |
|------------|---------------------|
| EMP (Employee Management) | EMPLOYEES, POSITIONS, JOBFUNCTIONS, DEPARTMENTS, COMPANIES |
| COMP (Competency Management) | COMPETENCIES, COMP_CATEGORIES, COMP_DOMAINS, COMP_SETS, COMP_ASSIGN |
| DEV (Development Planning) | EMP_PROFILE, COMP_ASSESSMENT, COMP_DASHBOARD, DEV_PLAN, CAREER_NAV, CAREER_PATH, ORG_COMPETENCY |
| USER (User Management) | USERS, ROLES, PERMISSIONS, AUDIT |
| REPORT (Reports) | REPORTS, ASSESSMENTS, IMPORT_DATA |

#### Example Role Configuration:

**HR Data Entry Role**
- ✅ EMPLOYEES (Create, Read, Update, Delete)
- ✅ POSITIONS (Read only)
- ✅ DEPARTMENTS (Read only)
- ✅ COMPANIES (Read only)

**Competency Specialist Role**
- ✅ COMPETENCIES (Create, Read, Update, Delete)
- ✅ COMP_CATEGORIES (Create, Read, Update, Delete)
- ✅ COMP_DOMAINS (Create, Read, Update, Delete)
- ✅ COMP_SETS (Create, Read, Update, Delete)
- ✅ COMP_ASSIGN (Read only)

**Development Manager Role**
- ✅ EMP_PROFILE (Read, Update)
- ✅ COMP_ASSESSMENT (Create, Read, Update)
- ✅ COMP_DASHBOARD (Read)
- ✅ DEV_PLAN (Create, Read, Update)
- ✅ CAREER_NAV (Read)
- ✅ CAREER_PATH (Read)
- ✅ EMPLOYEES (Read only)

## What the Fix Does

The `Fix_Orphaned_RolePermissions.sql` script:

1. **Finds orphaned permissions** - RolePermissions that point to deleted Permissions
2. **Shows affected roles** - Which roles have these orphaned entries
3. **Deletes orphaned entries** - Removes invalid RolePermissions
4. **Verifies cleanup** - Confirms no orphans remain
5. **Shows current status** - Displays active permissions per role

## Verify the Fix

After running the fix:

### 1. Check Server Logs
You should see logs like:
```
Updating permissions for role 15. Requested: X permission IDs
Found Y valid permissions out of X requested
```

### 2. Test Permission Update
1. Go to Roles page
2. Edit a role
3. Add/remove permissions
4. Click **Save**
5. Should succeed without 500 error

### 3. Test Permission Enforcement
1. Assign a role to a test user
2. Login as that user
3. Verify menus appear based on permissions
4. Try CRUD operations - should respect permissions

## Prevention

To avoid this issue in the future:

1. **Always run cleanup scripts in order:**
   - First: `Cleanup_ApplicationModules.sql`
   - Then: `Fix_Orphaned_RolePermissions.sql`
   - Finally: `Add_Granular_Permission_Modules_Fixed.sql`

2. **Backup before cleanup:**
   - The scripts create automatic backups
   - But manual SQL backup is recommended

3. **Test with non-admin user:**
   - After making permission changes
   - Always test with a regular user account

## Troubleshooting

### Still Getting 500 Error?

Check the backend console/logs for:
```
Invalid permission IDs requested: [list of IDs]
```

This tells you which permission IDs are invalid. You can then:

**Option 1: Remove invalid permissions from frontend**
- The PermissionMatrix component may be holding old permission IDs in state
- Hard refresh the page (Ctrl+F5)
- Clear localStorage in browser DevTools

**Option 2: Check database directly**
```sql
-- Find permissions with deleted modules
SELECT p.PermissionID, p.Description, m.ModuleCode, m.IsActive as ModuleActive
FROM Permissions p
LEFT JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
WHERE m.ModuleID IS NULL OR m.IsActive = 0;

-- If any found, delete them
DELETE FROM Permissions
WHERE ModuleID IN (
    SELECT ModuleID 
    FROM ApplicationModules 
    WHERE IsActive = 0
);
```

### Permission Cache Not Updating?

Users need to logout and login again:
1. Click **Sign out**
2. Login again
3. Permissions will be reloaded from server

Or wait 24 hours for cache to expire automatically.

### Frontend Shows Old Modules?

The permission matrix loads modules from the API. After cleanup:
1. Hard refresh browser (Ctrl+F5)
2. Check Network tab - API should return only new granular modules
3. If still showing old modules, check database:
```sql
SELECT ModuleCode, ModuleName, IsActive 
FROM ApplicationModules 
WHERE IsActive = 1
ORDER BY DisplayOrder;
```

## Summary

**Quick Fix Steps:**
1. ✅ Run `Fix_Orphaned_RolePermissions.sql`
2. ✅ Restart backend server
3. ✅ Hard refresh browser (Ctrl+F5)
4. ✅ Reassign permissions to roles
5. ✅ Test role update - should work!
6. ✅ Users logout/login to refresh cache

After these steps, role permission updates should work perfectly! 🎉
