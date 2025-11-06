# Granular Permission Implementation Guide

## Overview
This guide implements a granular permission system where each menu item in the sidebar has its own dedicated module and permissions.

## Database Changes Required

### 1. New Module Codes Structure
The system will use specific module codes for each menu item:

**Organization Management:**
- `EMPLOYEES` - Employee Records Management
- `POSITIONS` - Position Records Management  
- `JOBFUNCTIONS` - Job Function Management
- `DEPARTMENTS` - Department Records Management
- `COMPANIES` - Company Records Management

**Competency Management:**
- `COMPETENCIES` - Individual Competencies
- `COMP_CATEGORIES` - Competency Categories
- `COMP_DOMAINS` - Competency Domains
- `COMP_SETS` - Competency Sets
- `COMP_ASSIGN` - Competency Assignment

**Employee Development:**
- `EMP_PROFILE` - Employee Profile
- `COMP_ASSESSMENT` - Competency Assessment
- `COMP_DASHBOARD` - Competency Dashboard
- `DEV_PLAN` - Development Plan Management
- `CAREER_NAV` - Career Navigator
- `CAREER_PATH` - Career Path Planning
- `ORG_COMPETENCY` - Organization Competency View

**User Management:**
- `USERS` - User Account Management
- `ROLES` - Role Management
- `PERMISSIONS` - Permission Management
- `AUDIT` - Audit Log Management

**System Functions:**
- `REPORTS` - Reports & Analytics Management
- `ASSESSMENTS` - Assessment Management
- `IMPORT_DATA` - Data Import Management

### 2. Database Setup
Run the provided SQL script `Add_Granular_Permission_Modules_Fixed.sql` to:
- Add new granular modules
- Create permissions for each module
- Create sample granular roles

## Frontend Implementation

### 1. Update Home.tsx Navigation
Replace the current broad module checks with specific module permissions:

```typescript
// Old: moduleCode="EMP" permissionCode="R"
// New: moduleCode="EMPLOYEES" permissionCode="R"
```

### 2. Update Component Module Codes
Each component should use its specific module code:

- `Employees.tsx`: Use `EMPLOYEES` instead of `EMP`
- `Positions.tsx`: Use `POSITIONS` instead of `EMP`
- `JobFunctions.tsx`: Use `JOBFUNCTIONS` instead of `EMP`
- `Departments.tsx`: Use `DEPARTMENTS` instead of `EMP`
- `Companies.tsx`: Use `COMPANIES` instead of `ORG`
- `Competencies.tsx`: Use `COMPETENCIES` instead of `COMP`
- `CompetencyCategories.tsx`: Use `COMP_CATEGORIES` instead of `COMP`
- `CompetencyDomains.tsx`: Use `COMP_DOMAINS` instead of `COMP`
- `CompetencySets.tsx`: Use `COMP_SETS` instead of `COMP`
- `CompetencyAssign.tsx`: Use `COMP_ASSIGN` instead of `COMP`

### 3. Navigation Menu Mapping
Update the Home.tsx navigation to use granular permissions:

| Menu Item | Module Code | Description |
|-----------|-------------|-------------|
| Employees | EMPLOYEES | Employee records management |
| Positions | POSITIONS | Position management |
| Job Functions | JOBFUNCTIONS | Job function management |
| Departments | DEPARTMENTS | Department management |
| Companies | COMPANIES | Company management |
| Competencies | COMPETENCIES | Individual competencies |
| Categories | COMP_CATEGORIES | Competency categories |
| Domains | COMP_DOMAINS | Competency domains |
| Sets | COMP_SETS | Competency sets |
| Assign | COMP_ASSIGN | Competency assignment |
| Employee Profile | EMP_PROFILE | Employee profile view |
| Assessment | COMP_ASSESSMENT | Competency assessment |
| Dashboard | COMP_DASHBOARD | Competency dashboard |
| Development Plans | DEV_PLAN | Development planning |
| Career Navigator | CAREER_NAV | Career navigation |
| Career Path | CAREER_PATH | Career path planning |
| Organization Competency | ORG_COMPETENCY | Organization view |
| User Management | USERS | User account management |
| Role Management | ROLES | Role management |
| Permission Management | PERMISSIONS | Permission management |
| Audit Logs | AUDIT | Audit log management |
| Reports | REPORTS | Reports and analytics |
| Assessments | ASSESSMENTS | Assessment management |
| Import Data | IMPORT_DATA | Data import functions |

## Implementation Steps

### Phase 1: Database Setup (Completed)
1. ✅ Run SQL script to create new modules
2. ✅ Create permissions for new modules  
3. ✅ Create sample granular roles

### Phase 2: Frontend Updates (In Progress)
1. 🔄 Update Home.tsx navigation with granular permissions
2. ⏳ Update all component module codes
3. ⏳ Test permission enforcement
4. ⏳ Update user management interface

### Phase 3: Testing & Migration
1. ⏳ Test all permission combinations
2. ⏳ Create migration guide for existing users
3. ⏳ Update documentation

## Benefits
- **Granular Control**: Each menu item can be individually controlled
- **Role Flexibility**: Create roles with very specific access patterns
- **Better Security**: More precise permission enforcement
- **Scalability**: Easy to add new menu items with their own permissions
- **User Experience**: Users only see what they can actually use

## Migration Notes
- Existing broad permissions (EMP, COMP, etc.) will continue to work
- New granular permissions provide more specific control
- Administrators can gradually migrate users to granular roles
- Both systems can coexist during transition period