# Okta Email to Employee Matching Process

This document explains how the system matches Okta user emails with employee records in the database to obtain the EmployeeID.

## Overview

When a user logs in through Okta, the system:
1. Extracts the user's email from Okta user information
2. Searches the Employees table for a matching email
3. Stores the complete employee record in localStorage
4. Uses the EmployeeID for all subsequent operations

## Email Extraction from Okta

The system tries multiple properties from the Okta user object to find an email:

```typescript
const email = userInfo.email || userInfo.preferred_username || userInfo.sub;
```

**Priority order:**
1. `userInfo.email` - Standard email field
2. `userInfo.preferred_username` - Alternative username field (often contains email)
3. `userInfo.sub` - Subject identifier (fallback)

## Employee Matching Process

### Database Structure
The Employees table has the following relevant fields:
- `EmployeeID` (INT, Primary Key)
- `Email` (NVARCHAR(100))
- `IsActive` (BIT) - Only active employees are returned by the API

### Matching Logic
```typescript
// Case-insensitive, trimmed comparison
const empEmail = emp.email?.toLowerCase()?.trim();
const searchEmail = userEmail?.toLowerCase()?.trim();
const isMatch = empEmail && searchEmail && empEmail === searchEmail;
```

### API Endpoint
- **URL**: `GET /api/Employees`
- **Returns**: Array of `EmployeeDto` objects
- **Filter**: Only active employees (`IsActive = true`)

## Debugging Information

The system provides extensive logging to help troubleshoot email matching:

### LoginCallback Component
- Logs all available employee emails
- Shows comparison process for each employee
- Indicates successful matches or failure reasons

### Home Component
- Displays extracted Okta email
- Shows matched employee details including EmployeeID
- Indicates if matching was successful

## Common Issues and Solutions

### 1. Email Not Found
**Symptoms**: User logs in but gets default employee (EmployeeID: 1)
**Possible Causes**:
- Okta email doesn't match any employee email in database
- Employee exists but has no email or different email
- Employee is inactive (IsActive = false)

**Solutions**:
- Check database for employee with matching email
- Verify employee is active
- Update employee email in database if needed

### 2. Case Sensitivity Issues
**Symptoms**: Email looks correct but no match found
**Solution**: System now handles case-insensitive matching automatically

### 3. Whitespace Issues
**Symptoms**: Email looks correct but no match found
**Solution**: System now trims whitespace automatically

## Data Flow

```
Okta Login → LoginCallback → Extract Email → Fetch Employees → Match Email → Store Employee → Redirect to Home
```

## Storage in localStorage

After successful matching, the following data is stored:

```typescript
// Dedicated email storage
localStorage.setItem('userEmail', extractedEmail);

// Full Okta user object
localStorage.setItem('oktaUser', JSON.stringify(oktaUserInfo));

// Complete employee record
localStorage.setItem('currentEmployee', JSON.stringify(employeeRecord));

// Authentication flag
localStorage.setItem('isAuthenticated', 'true');
```

## Accessing Employee Data

Use the utility functions to access employee data:

```typescript
import { getUserEmail, getCurrentEmployee } from '../utils/auth';

const userEmail = getUserEmail();           // Extracted email
const employee = getCurrentEmployee();      // Complete employee record
const employeeID = employee?.employeeID;    // Employee ID for API calls
```

## Testing the Matching Process

1. **Check Console Logs**: Look for detailed matching information in browser console
2. **Verify Database**: Ensure employee email exists and is active
3. **Test Different Emails**: Try with various email formats to ensure robust matching

## Related Files

- `src/pages/LoginCallback.tsx` - Main email matching logic
- `src/utils/auth.ts` - Utility functions for accessing stored data
- `src/pages/Home.tsx` - Display of matched employee information
- `Career_Management.Server/Controllers/EmployeesController.cs` - Employee API endpoint
- `Career_Management.Server/Models/DTOs/EmployeeDto.cs` - Employee data structure
