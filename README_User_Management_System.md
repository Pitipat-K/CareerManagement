# User Management & Permission System

## Overview

This document describes the comprehensive User Management and Permission System designed for the Career Management Application. The system implements **Role-Based Access Control (RBAC)** with fine-grained permissions, audit trails, and flexible user management capabilities.

## System Architecture

### Current Integration
- **Okta Authentication**: Users authenticate via Okta SSO
- **Employee Mapping**: Okta users are mapped to `Employees` table via email
- **Permission Layer**: New permission system sits on top of existing employee structure

### Key Components
1. **Users**: Authentication layer linked to employees
2. **Roles**: Define job functions and access levels
3. **Permissions**: Specific actions on application modules
4. **Application Modules**: System features/areas
5. **Audit Trail**: Complete logging of permission changes

## Database Schema

### Core Tables

#### Users
- Links Okta authentication to employee records
- Supports system admin flag and account lockout
- One-to-one relationship with Employees table

```sql
Users (UserID, EmployeeID, Username, IsSystemAdmin, LastLoginDate, IsLocked, ...)
```

#### ApplicationModules
- Defines system modules/features that can be protected
- 8 default modules: Employee, Position, Competency, Assessment, Development, Company, Reports, User Management

```sql
ApplicationModules (ModuleID, ModuleName, ModuleCode, DisplayOrder, ...)
```

#### PermissionTypes
- Defines types of actions: Create, Read, Update, Delete, Approve, Manage
- Used to build granular permissions

```sql
PermissionTypes (PermissionTypeID, PermissionName, PermissionCode, ...)
```

#### Permissions
- Combination of Module + Permission Type
- 48 total permissions (8 modules × 6 permission types)

```sql
Permissions (PermissionID, ModuleID, PermissionTypeID, Description, ...)
```

#### Roles
- Predefined or custom roles with specific permission sets
- Support for department/company-specific roles

```sql
Roles (RoleID, RoleName, RoleCode, IsSystemRole, DepartmentID, CompanyID, ...)
```

### Relationship Tables

#### UserRoles
- Many-to-many relationship between Users and Roles
- Supports role expiration dates

#### RolePermissions
- Many-to-many relationship between Roles and Permissions
- Defines what each role can do

#### UserPermissionOverrides
- Exception handling for specific user permission grants/denials
- Overrides role-based permissions when needed

### Audit Table

#### PermissionAuditLog
- Complete audit trail of all permission changes
- Tracks who, what, when, why for all actions

## Default Roles & Permissions

### System Administrator
- **Access**: Full system access
- **Permissions**: All permissions on all modules
- **Use Case**: IT administrators, system maintainers

### HR Administrator
- **Access**: Full HR operations
- **Permissions**: 
  - Full access: Employee, Position, Competency, Development Management
  - Read access: Assessment, Organization, Reports
  - Limited access: User Management (read/update only)

### Department Manager
- **Access**: Department-level management
- **Permissions**:
  - Update access: Employee, Position data
  - Full access: Assessment, Development Planning (with approval rights)
  - Read access: Competency, Organization, Reports

### Team Lead
- **Access**: Team management
- **Permissions**:
  - Read access: Employee, Position, Competency data
  - Full access: Team assessments and development planning
  - Read access: Reports

### Employee
- **Access**: Self-service
- **Permissions**:
  - Read access: Employee, Position, Competency data
  - Full access: Own assessments and development plans
  - Read access: Reports

### HR Specialist
- **Access**: Limited HR operations
- **Permissions**:
  - Create/Read/Update: Employee, Position, Competency data
  - Read access: Assessment, Development, Organization, Reports

### Assessor
- **Access**: Assessment-focused
- **Permissions**:
  - Read access: Employee, Position, Competency data
  - Full access: Assessment management (including approvals)
  - Read access: Development plans, Reports

### Read Only
- **Access**: View-only access
- **Permissions**: Read access to most modules (except User Management)

## Permission Checking

### Function-Based Checking
```sql
-- Check if user has specific permission
SELECT dbo.fn_HasPermission(123, 'EMP', 'C') -- Can user 123 create employees?

-- Get all permissions for a user
SELECT * FROM dbo.fn_GetUserPermissions(123)
```

### Permission Hierarchy
1. **System Admin**: Automatically has all permissions
2. **Explicit Deny Override**: Takes precedence over any grant
3. **Explicit Grant Override**: Overrides role-based permissions
4. **Role-Based Permissions**: Standard role assignments

### Permission Codes
- **Modules**: EMP, POS, COMP, ASSESS, DEV, ORG, REPORT, USER
- **Actions**: C (Create), R (Read), U (Update), D (Delete), A (Approve), M (Manage)
- **Format**: `MODULE_ACTION` (e.g., `EMP_C` for "Create Employee")

## Management Operations

### User Creation
```sql
-- Create user from existing employee
EXEC sp_CreateUserFromEmployee 
    @EmployeeID = 123,
    @Username = 'john.doe@company.com',
    @DefaultRoleCode = 'EMPLOYEE',
    @CreatedBy = 1
```

### Role Assignment
```sql
-- Assign role to user
EXEC sp_AssignRoleToUser 
    @UserID = 456,
    @RoleID = 3,
    @AssignedBy = 1,
    @Reason = 'Promoted to Team Lead'

-- Remove role from user
EXEC sp_RemoveRoleFromUser 
    @UserID = 456,
    @RoleID = 2,
    @RemovedBy = 1,
    @Reason = 'Role change'
```

## Helpful Views

### vw_UserPermissions
- Complete view of all user permissions
- Shows source (Role vs Override)
- Includes effective dates and expiration

### vw_UserRoleSummary
- User overview with roles and employee information
- Perfect for user management dashboards

### vw_RolePermissionSummary
- Role overview with permission counts
- Shows which users have each role

### vw_PermissionAuditSummary
- Human-readable audit log
- Shows what changed, when, and why

## Implementation Guide

### 1. Database Setup
```sql
-- Run in sequence:
1. Setup_User_Management.sql          -- Creates tables and basic data
2. User_Management_Views_Functions.sql -- Creates views and functions
```

### 2. Application Integration

#### Authentication Flow
1. User authenticates via Okta
2. System looks up User record by email/username
3. Loads user permissions into session/cache
4. Each request checks permissions before allowing actions

#### Permission Checking in Code
```csharp
// Example C# implementation
public bool HasPermission(int userId, string moduleCode, string permissionCode)
{
    return _dbContext.Database.SqlQuery<bool>(
        "SELECT dbo.fn_HasPermission(@userId, @moduleCode, @permissionCode)",
        new SqlParameter("@userId", userId),
        new SqlParameter("@moduleCode", moduleCode),
        new SqlParameter("@permissionCode", permissionCode)
    ).FirstOrDefault();
}

// Usage in controller
[HttpPost]
public IActionResult CreateEmployee(EmployeeDto employee)
{
    if (!HasPermission(CurrentUserId, "EMP", "C"))
        return Forbid();
    
    // Proceed with employee creation
}
```

#### Frontend Integration
```typescript
// Example TypeScript/React implementation
interface UserPermissions {
  [key: string]: boolean; // e.g., "EMP_C": true
}

const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  
  useEffect(() => {
    // Load user permissions on login
    fetchUserPermissions().then(setPermissions);
  }, []);
  
  const hasPermission = (moduleCode: string, actionCode: string) => {
    return permissions[`${moduleCode}_${actionCode}`] || false;
  };
  
  return { hasPermission };
};

// Usage in component
const EmployeeManagement = () => {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      {hasPermission('EMP', 'C') && (
        <button onClick={createEmployee}>Create Employee</button>
      )}
      {hasPermission('EMP', 'R') && (
        <EmployeeList />
      )}
    </div>
  );
};
```

### 3. User Management UI

#### Required Pages/Components
1. **User List**: Show all users with roles
2. **User Details**: Edit user info and role assignments
3. **Role Management**: Create/edit roles and permissions
4. **Permission Matrix**: Visual permission assignment
5. **Audit Log**: View permission change history

#### Key Features
- Role assignment with expiration dates
- Permission overrides for exceptions
- Bulk role assignments
- Permission inheritance visualization
- Audit trail with filtering

## Security Considerations

### Best Practices
1. **Principle of Least Privilege**: Users get minimum required permissions
2. **Role Segregation**: Separate roles for different job functions
3. **Regular Audits**: Review permissions periodically
4. **Audit Everything**: Log all permission changes
5. **Secure Defaults**: New users get minimal permissions

### Security Features
- Account lockout after failed attempts
- Role expiration dates
- Permission override audit trail
- System admin separation
- Soft deletes for audit preservation

## Maintenance & Monitoring

### Regular Tasks
1. **User Review**: Quarterly review of user roles
2. **Permission Audit**: Annual permission review
3. **Role Cleanup**: Remove unused roles
4. **Audit Log Cleanup**: Archive old audit records

### Monitoring Queries
```sql
-- Users with multiple roles
SELECT * FROM vw_UserRoleSummary WHERE RoleCount > 2

-- Permissions granted via override
SELECT * FROM vw_UserPermissions WHERE PermissionSource = 'Override'

-- Recent permission changes
SELECT * FROM vw_PermissionAuditSummary 
WHERE ActionDate >= DATEADD(day, -7, GETDATE())

-- Users without any roles
SELECT u.* FROM Users u
LEFT JOIN UserRoles ur ON u.UserID = ur.UserID AND ur.IsActive = 1
WHERE ur.UserID IS NULL AND u.IsSystemAdmin = 0
```

## Future Enhancements

### Planned Features
1. **Dynamic Permissions**: Runtime permission creation
2. **Approval Workflows**: Multi-step permission requests
3. **Time-based Access**: Temporary permission grants
4. **API Rate Limiting**: Permission-based API limits
5. **Advanced Reporting**: Permission analytics dashboard

### Scalability Considerations
- Permission caching for performance
- Hierarchical roles (role inheritance)
- Department-based permission scoping
- Integration with external identity providers

## Troubleshooting

### Common Issues
1. **User can't access feature**: Check role assignments and permission mappings
2. **Permission denied unexpectedly**: Look for override denials
3. **Performance issues**: Implement permission caching
4. **Audit trail gaps**: Ensure all permission changes use stored procedures

### Debug Queries
```sql
-- Check user's effective permissions
SELECT * FROM fn_GetUserPermissions(123)

-- Find why user lacks permission
SELECT 'User exists' WHERE EXISTS (SELECT 1 FROM Users WHERE UserID = 123)
UNION SELECT 'Has active roles' WHERE EXISTS (SELECT 1 FROM UserRoles WHERE UserID = 123 AND IsActive = 1)
UNION SELECT 'Role has permission' WHERE EXISTS (
    SELECT 1 FROM UserRoles ur
    JOIN RolePermissions rp ON ur.RoleID = rp.RoleID
    JOIN Permissions p ON rp.PermissionID = p.PermissionID
    JOIN ApplicationModules m ON p.ModuleID = m.ModuleID
    JOIN PermissionTypes pt ON p.PermissionTypeID = pt.PermissionTypeID
    WHERE ur.UserID = 123 AND m.ModuleCode = 'EMP' AND pt.PermissionCode = 'C'
)
```

This comprehensive user management system provides enterprise-grade security and flexibility while maintaining simplicity for day-to-day operations.
