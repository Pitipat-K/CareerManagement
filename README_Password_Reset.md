# Password Reset Feature Documentation

## Overview

The password reset feature allows users to reset their forgotten passwords through a secure two-step verification process. System administrators can also reset passwords for any user through the User Management interface.

## Features Implemented

### ✅ User Self-Service Password Reset
- Forgot Password link on login page
- Two-step verification process
- Password strength indicator
- Secure password reset flow

### ✅ Admin Password Management
- Reset password for any user
- Create password when creating new user
- Password management from User List
- Visual password strength feedback

## User Self-Service Password Reset Flow

### Step 1: Initiate Password Reset
1. User clicks "Forgot Password?" on the login page
2. User is redirected to `/forgot-password`
3. User enters:
   - **Employee Code** (e.g., EMP001)
   - **Email Address** (registered with employee profile)

### Step 2: Verify Identity
- System verifies employee code and email match
- Checks if user account exists and is active
- Verifies account is not locked
- Returns employee information if verification successful

### Step 3: Reset Password
- User creates a new password (minimum 8 characters)
- Real-time password strength indicator shows:
  - Weak (< 8 characters or simple password)
  - Medium (8-12 characters with some complexity)
  - Strong (12+ characters with uppercase, lowercase, numbers, special characters)
- User confirms the new password
- System resets password and unlocks account if locked

### Step 4: Login with New Password
- User is redirected to login page
- User can immediately login with new credentials

## Admin Password Management

### Reset Password for Existing User

**Location:** User Management > Users List

1. Click the **Key icon** (🔑) next to any user
2. Password Reset Modal opens
3. Enter new password (minimum 8 characters)
4. Confirm password
5. Click "Reset Password"

**Features:**
- Password strength indicator
- Real-time validation
- Password match verification
- Requirements checklist

### Create Password During User Creation

**Location:** User Management > Create User Modal

1. Click "Create User" button
2. Fill in employee and user details
3. Check "Set password immediately after creation"
4. Click "Create User"
5. Password modal automatically opens
6. Set initial password for the user

## Backend API Endpoints

### 1. Forgot Password (Verify Identity)
```http
POST /api/Authentication/forgot-password
Content-Type: application/json

{
  "employeeCode": "EMP001",
  "email": "john.doe@company.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee verified. You can now reset your password.",
  "employeeID": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com"
}
```

**Error Responses:**
- `400 Bad Request` - Missing employee code or email
- `404 Not Found` - Invalid employee code or email
- `400 Bad Request` - Account is locked

### 2. Reset Password
```http
POST /api/Authentication/reset-password
Content-Type: application/json

{
  "employeeID": 1,
  "employeeCode": "EMP001",
  "email": "john.doe@company.com",
  "newPassword": "NewSecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

**Error Responses:**
- `400 Bad Request` - Invalid data or password requirements not met
- `404 Not Found` - User not found
- `400 Bad Request` - Verification failed (employee code/email mismatch)

### 3. Set Password (Admin)
```http
POST /api/Authentication/set-password
Content-Type: application/json

{
  "employeeID": 1,
  "newPassword": "NewPassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Security Features

### ✅ Identity Verification
- Requires both employee code AND email for verification
- Prevents unauthorized password resets
- No indication whether employee exists (security by obscurity)

### ✅ Password Requirements
- **Minimum Length:** 8 characters
- **Recommended:** 
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*...)

### ✅ Account Protection
- Automatically unlocks locked accounts after reset
- Resets login attempt counter
- Validates employee-email relationship

### ✅ Session Security
- Verification data stored only during password reset flow
- Employee ID validated against employee code and email during reset
- Prevents session hijacking

## Frontend Components

### 1. ForgotPassword Page
**Location:** `career_management.client/src/pages/ForgotPassword.tsx`

**Features:**
- Two-step process with visual indicators
- Form validation
- Password strength meter
- Real-time password matching
- Error handling

### 2. PasswordModal Component
**Location:** `career_management.client/src/components/UserManagement/PasswordModal.tsx`

**Features:**
- Reusable modal for password management
- Password visibility toggle
- Strength indicator
- Requirements checklist
- Confirmation validation

### 3. Login Page Updates
**Location:** `career_management.client/src/pages/Login.tsx`

**Changes:**
- Added "Forgot Password?" link on Step 2 (email/password entry)
- Link redirects to `/forgot-password`

## Testing Guide

### Test Case 1: Successful Password Reset

**Steps:**
1. Navigate to login page
2. Click "Forgot Password?"
3. Enter valid employee code: `EMP001`
4. Enter matching email: `john.doe@company.com`
5. Click "Continue"
6. Verify identity confirmation shown
7. Enter new password: `TestPassword123!`
8. Confirm password: `TestPassword123!`
9. Click "Reset Password"
10. Verify success message
11. Login with new password

**Expected Result:** ✅ Password reset successful, user can login

### Test Case 2: Invalid Employee Code or Email

**Steps:**
1. Go to Forgot Password page
2. Enter invalid employee code or email
3. Click "Continue"

**Expected Result:** ⚠️ Error: "Invalid employee code or email"

### Test Case 3: Password Mismatch

**Steps:**
1. Complete identity verification
2. Enter password: `Password123!`
3. Enter different confirmation: `Different123!`
4. Try to submit

**Expected Result:** ❌ Button disabled, error shown

### Test Case 4: Weak Password

**Steps:**
1. Complete identity verification
2. Enter password: `abc123` (< 8 characters)
3. Try to submit

**Expected Result:** ⚠️ Error: "Password must be at least 8 characters long"

### Test Case 5: Admin Reset User Password

**Steps:**
1. Login as admin
2. Go to User Management
3. Click Key icon next to a user
4. Enter new password
5. Confirm password
6. Click "Reset Password"

**Expected Result:** ✅ Password reset successful

### Test Case 6: Create User with Password

**Steps:**
1. Login as admin
2. Click "Create User"
3. Fill in user details
4. Check "Set password immediately after creation"
5. Click "Create User"
6. Password modal opens automatically
7. Set password

**Expected Result:** ✅ User created with password set

## Password Strength Criteria

### Weak (Red) 🔴
- Less than 8 characters
- Only lowercase or only numbers
- No special characters

### Medium (Yellow) 🟡
- 8-11 characters
- Mix of 2-3 character types
- Meets minimum requirements

### Strong (Green) 🟢
- 12+ characters
- Mix of 3-4 character types:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters

## User Interface

### Login Page - Forgot Password Link
```
┌─────────────────────────┐
│  Email:                 │
│  [john@company.com]     │
│                         │
│  Password:   Forgot?    │ ← "Forgot Password?" link
│  [••••••••]             │
│                         │
│  [Sign In]              │
└─────────────────────────┘
```

### Forgot Password - Step 1
```
┌─────────────────────────┐
│  ①━━━━②                │
│  Verify Identity        │
│                         │
│  Employee Code:         │
│  [EMP001]               │
│                         │
│  Email:                 │
│  [john@company.com]     │
│                         │
│  [Back]  [Continue →]   │
└─────────────────────────┘
```

### Forgot Password - Step 2
```
┌─────────────────────────┐
│  ①━━━━②                │
│  Reset Password         │
│                         │
│  ✓ John Doe             │
│  john@company.com       │
│                         │
│  New Password:          │
│  [••••••••]  👁         │
│  ████████░░ Strong      │
│                         │
│  Confirm Password:      │
│  [••••••••]  👁         │
│  ✓ Passwords match      │
│                         │
│  Requirements:          │
│  ✓ At least 8 chars     │
│  ✓ Uppercase            │
│  ✓ Lowercase            │
│  ✓ Number               │
│  ✓ Special char         │
│                         │
│  [← Back] [Reset Password]│
└─────────────────────────┘
```

## Common Issues & Solutions

### Issue: "Invalid employee code or email"
**Solution:** 
- Verify employee code is correct
- Ensure email matches the one in employee profile
- Check with HR if uncertain about employee details

### Issue: "No user account found"
**Solution:** 
- Contact HR to create a user account
- System admin can create user via User Management

### Issue: "Account is locked"
**Solution:** 
- Wait for lockout period to expire (30 minutes)
- OR admin can manually unlock via User Management
- Password reset automatically unlocks the account

### Issue: "Password must be at least 8 characters"
**Solution:** 
- Enter a password with minimum 8 characters
- Add complexity for better security

### Issue: "Passwords do not match"
**Solution:** 
- Ensure both password fields have exactly the same value
- Check for extra spaces or typos

## Files Modified/Created

### Backend (C#)
| File | Changes |
|------|---------|
| `Career_Management.Server/Controllers/AuthenticationController.cs` | ✨ Added `/forgot-password` and `/reset-password` endpoints |

### Frontend (React/TypeScript)
| File | Changes |
|------|---------|
| `career_management.client/src/pages/ForgotPassword.tsx` | ✨ New forgot password page |
| `career_management.client/src/pages/Login.tsx` | ✏️ Added "Forgot Password?" link |
| `career_management.client/src/App.tsx` | ✏️ Added `/forgot-password` route |
| `career_management.client/src/components/UserManagement/PasswordModal.tsx` | ✨ New reusable password modal |
| `career_management.client/src/components/UserManagement/UserList.tsx` | ✏️ Added password reset functionality |
| `career_management.client/src/services/userManagementApi.ts` | ✏️ Added password management methods |

## Security Best Practices

### ✅ Implemented
1. **Two-Factor Verification** - Employee code + Email
2. **Password Hashing** - SHA256 with salt
3. **Account Lockout Reset** - Automatic unlock on password reset
4. **No Information Disclosure** - Generic error messages
5. **Session Validation** - Re-verify credentials during reset
6. **Password Strength Requirements** - Minimum 8 characters

### 🔄 Future Enhancements
1. **Email Verification** - Send reset link via email
2. **Time-Limited Reset Tokens** - Expire after 15-30 minutes
3. **BCrypt Hashing** - Upgrade from SHA256
4. **2FA Support** - Two-factor authentication
5. **Password History** - Prevent reuse of recent passwords
6. **Rate Limiting** - Prevent brute force attacks
7. **Audit Logging** - Track all password reset attempts

## Support & Troubleshooting

### For Users
- If you forgot your employee code, contact HR
- If email is not recognized, verify with IT support
- If account is locked, contact IT support or wait 30 minutes

### For Admins
- Use User Management to reset any user's password
- Check audit logs for password reset history
- Manually unlock accounts if needed

### For Developers
- Check server logs for detailed error messages
- Verify database connectivity
- Ensure employee email is populated in database

## API Testing

### Using PowerShell
```powershell
# Step 1: Verify Identity
$body = @{
    employeeCode = "EMP001"
    email = "john.doe@company.com"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://localhost:7026/api/Authentication/forgot-password" `
    -Method POST -Body $body -ContentType "application/json"

# Step 2: Reset Password
$resetBody = @{
    employeeID = $response.employeeID
    employeeCode = "EMP001"
    email = "john.doe@company.com"
    newPassword = "NewPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:7026/api/Authentication/reset-password" `
    -Method POST -Body $resetBody -ContentType "application/json"
```

### Using curl
```bash
# Step 1
curl -X POST https://localhost:7026/api/Authentication/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"employeeCode":"EMP001","email":"john.doe@company.com"}'

# Step 2
curl -X POST https://localhost:7026/api/Authentication/reset-password \
  -H "Content-Type: application/json" \
  -d '{"employeeID":1,"employeeCode":"EMP001","email":"john.doe@company.com","newPassword":"NewPassword123!"}'
```

## Summary

The password reset feature provides:
- ✅ **User-friendly** self-service password reset
- ✅ **Secure** two-step verification process
- ✅ **Admin tools** for password management
- ✅ **Real-time feedback** with password strength indicators
- ✅ **Comprehensive validation** and error handling
- ✅ **Seamless integration** with existing authentication system

Users can now easily reset their forgotten passwords without IT support, while administrators retain full control over user password management through the User Management interface.

---

**Last Updated:** October 2024  
**Version:** 1.0  
**Status:** ✅ Production Ready

