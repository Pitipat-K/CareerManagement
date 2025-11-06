# Quick Setup Guide: Password-Based Login

## What Was Changed

### ✅ Database
- Added password fields to Users table (PasswordHash, PasswordSalt, PasswordChangedDate, RequirePasswordChange)
- Created migration script: `Career_Management.Server/Database_info/Add_Password_Authentication.sql`

### ✅ Backend
- Updated User model with password fields
- Created AuthenticationController with endpoints:
  - `POST /api/Authentication/verify-employee-code` - Step 1: Verify employee code
  - `POST /api/Authentication/login` - Step 2: Login with email/password
  - `POST /api/Authentication/set-password` - Set or change password

### ✅ Frontend
- Modified Login page to use two-step authentication:
  - Step 1: Enter employee code
  - Step 2: Enter email and password
- Added visual step indicator
- Improved error handling and user feedback

## Setup Instructions

### Step 1: Run Database Migration

Execute the SQL script to add password fields to your database:

```sql
-- File: Career_Management.Server/Database_info/Add_Password_Authentication.sql
-- Run this in SQL Server Management Studio or your SQL client
```

### Step 2: Create Test User (Optional)

```sql
-- File: Career_Management.Server/Database_info/Setup_Test_User_With_Password.sql
-- This script will help you set up a test user
```

### Step 3: Set Password for a User

**Option A: Using PowerShell**
```powershell
$body = @{
    employeeID = 1  # Replace with actual employee ID
    newPassword = "TestPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/Authentication/set-password" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**Option B: Using Postman**
```
POST http://localhost:5000/api/Authentication/set-password
Content-Type: application/json

{
  "employeeID": 1,
  "newPassword": "TestPassword123!"
}
```

### Step 4: Test the Login

1. Start your backend server
2. Start your frontend application
3. Navigate to `/login`
4. **Step 1**: Enter employee code (e.g., `TEST001`)
5. Click "Continue"
6. **Step 2**: Enter email and password
7. Click "Sign In"

## New Login Flow

```
┌─────────────────────┐
│  Enter Employee     │
│  Code               │
│                     │
│  [TEST001]          │
│                     │
│  [Continue →]       │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  Welcome Back       │
│  John Doe           │
│  Software Engineer  │
│                     │
│  Email:             │
│  [john@company.com] │
│                     │
│  Password:          │
│  [••••••••••]       │
│                     │
│  [← Back] [Sign In] │
└─────────────────────┘
           ↓
┌─────────────────────┐
│  Home Page          │
└─────────────────────┘
```

## Security Features

✅ **Password Hashing**: SHA256 with random salt  
✅ **Account Lockout**: 5 failed attempts = 30 min lockout  
✅ **Login Tracking**: Tracks failed login attempts  
✅ **Password History**: Tracks when password was changed  
✅ **Account Status**: Checks if account is active/locked  

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Test user created with employee code
- [ ] Password set for test user via API
- [ ] Can enter employee code (Step 1)
- [ ] Can see employee name and position (Step 2)
- [ ] Can login with correct email/password
- [ ] Shows error for wrong password
- [ ] Account locks after 5 failed attempts
- [ ] Can go back to change employee code
- [ ] Error messages are clear and helpful

## Common Issues & Solutions

### Issue: "Employee code not found"
**Solution**: Make sure the employee has an EmployeeCode in the Employees table

### Issue: "No user account found for this employee"
**Solution**: Create a User record for the employee:
```sql
INSERT INTO Users (EmployeeID, Username, IsActive)
SELECT EmployeeID, Email, 1
FROM Employees
WHERE EmployeeID = [your_employee_id]
```

### Issue: "Account password not set"
**Solution**: Use the set-password API endpoint to create a password

### Issue: "Account is locked"
**Solution**: Wait 30 minutes or manually unlock:
```sql
UPDATE Users 
SET IsLocked = 0, LockoutEndDate = NULL, LoginAttempts = 0 
WHERE UserID = [user_id]
```

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/Authentication/verify-employee-code` | POST | Verify employee code exists |
| `/api/Authentication/login` | POST | Login with email and password |
| `/api/Authentication/set-password` | POST | Set or change user password |

## Next Steps (Optional Enhancements)

1. **Password Management Page**: Create a page for users to change their password
2. **Forgot Password**: Implement email-based password reset
3. **Admin Interface**: Create UI for admins to manage user passwords
4. **Bulk Password Setup**: Script to send password setup emails to all users
5. **Enhanced Security**: 
   - Switch from SHA256 to BCrypt
   - Add password complexity requirements
   - Implement 2FA
   - Add JWT session tokens

## File References

### Backend Files
- `Career_Management.Server/Models/User.cs`
- `Career_Management.Server/Controllers/AuthenticationController.cs`
- `Career_Management.Server/Database_info/Add_Password_Authentication.sql`
- `Career_Management.Server/Database_info/Setup_Test_User_With_Password.sql`

### Frontend Files
- `career_management.client/src/pages/Login.tsx`

### Documentation
- `README_Password_Authentication.md` - Detailed documentation
- `SETUP_PASSWORD_LOGIN.md` - This file

## Support

For detailed documentation, see: `README_Password_Authentication.md`

---

**Created**: October 1, 2025  
**Status**: Ready for Testing ✅

