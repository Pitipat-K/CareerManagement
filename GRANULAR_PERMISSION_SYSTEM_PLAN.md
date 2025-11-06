# Granular Permission System Implementation Plan

## Overview
This document outlines the plan to split the current 8 broad modules into granular, menu-specific modules where each sidebar menu item has its own dedicated module permission.

## Current vs. Proposed Module Structure

### Current Modules (8 broad modules):
1. **EMP** - Employee Management
2. **POS** - Position Management  
3. **COMP** - Competency Management
4. **ASSESS** - Assessment Management
5. **DEV** - Development Planning
6. **ORG** - Company Management
7. **REPORT** - Reports & Analytics
8. **USER** - User Management

### Proposed Granular Modules (20+ specific modules):

#### **Organization Management Modules:**
1. **EMPLOYEES** - Employee Management
2. **POSITIONS** - Position Management
3. **JOBFUNCTIONS** - Job Functions Management
4. **DEPARTMENTS** - Department Management
5. **COMPANIES** - Company Management

#### **Competency Management Modules:**
6. **COMPETENCIES** - Individual Competencies
7. **COMP_CATEGORIES** - Competency Categories
8. **COMP_DOMAINS** - Competency Domains
9. **COMP_SETS** - Competency Sets
10. **COMP_ASSIGN** - Competency Assignment

#### **Employee Development Modules:**
11. **EMP_PROFILE** - Employee Profile
12. **COMP_ASSESSMENT** - Competency Assessment
13. **COMP_DASHBOARD** - Competency Dashboard
14. **DEV_PLAN** - Development Planning
15. **CAREER_NAV** - Career Navigator
16. **CAREER_PATH** - Career Path Planning
17. **ORG_COMPETENCY** - Organization Competency View

#### **User Management Modules:**
18. **USERS** - User Management
19. **ROLES** - Role Management
20. **PERMISSIONS** - Permission Management
21. **AUDIT** - Audit Log

#### **System Modules:**
22. **REPORTS** - Reports & Analytics
23. **ASSESSMENTS** - Assessment Management
24. **IMPORT_DATA** - Data Import Functions

## Implementation Steps

### Step 1: Database Schema Updates
- Add new ApplicationModules for each granular permission
- Create new Permissions for each module (C, R, U, D, A, M for each)
- Update existing roles to map to new granular permissions
- Create migration scripts for existing data

### Step 2: Backend Updates
- Update controllers to use new module codes
- Update permission checking logic
- Ensure backward compatibility during transition

### Step 3: Frontend Updates
- Update all components to use new specific module codes
- Update navigation menus with permission guards
- Update Home page menu items with granular permissions
- Test all permission combinations

### Step 4: Role Migration
- Create mapping from old broad permissions to new granular permissions
- Update existing user roles to include appropriate granular permissions
- Provide admin tools to manage the transition

## Benefits of Granular Permissions

1. **Fine-Grained Control**: Administrators can control access to specific menu items
2. **Better Security**: Users only see and can access exactly what they need
3. **Clearer Permissions**: Easier to understand what each permission controls
4. **Flexible Role Design**: Create more specific roles (e.g., "Competency Viewer", "Employee Data Entry")
5. **Audit Clarity**: Better tracking of what users can access

## Migration Strategy

### Phase 1: Add New Modules (Backward Compatible)
- Add all new granular modules to database
- Keep existing broad modules active
- Update frontend to check both old and new permissions (OR logic)

### Phase 2: Update Roles
- Create new roles using granular permissions
- Provide migration tools for administrators
- Allow gradual transition

### Phase 3: Remove Old Modules
- After all roles are migrated, remove old broad modules
- Update frontend to only use new granular permissions
- Clean up database

## Example Permission Scenarios

### Scenario 1: HR Data Entry Clerk
**Access**: EMPLOYEES_C, EMPLOYEES_R, EMPLOYEES_U, POSITIONS_R, DEPARTMENTS_R
**Result**: Can manage employee data but only view positions and departments

### Scenario 2: Competency Specialist  
**Access**: COMPETENCIES_*, COMP_CATEGORIES_*, COMP_DOMAINS_*, COMP_SETS_*
**Result**: Full access to competency structure but no access to assignments or employee data

### Scenario 3: Department Manager
**Access**: EMPLOYEES_R, COMP_ASSESSMENT_R, COMP_DASHBOARD_R, DEV_PLAN_R, CAREER_NAV_R
**Result**: Can view employee development data for their team but cannot modify competency structure

### Scenario 4: System Administrator
**Access**: All permissions (isSystemAdmin = true)
**Result**: Full access to everything

This granular approach will provide much better control over what users can access and perform in the system.
