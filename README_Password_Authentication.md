# Password-Based Authentication Implementation

## Overview

This document describes the implementation of a two-step password-based authentication system that replaces the simple employee code login.

## Authentication Flow

### New Login Process

1. **Step 1: Employee Code Verification**
   - User enters their employee code
   - System verifies the employee exists and has an active user account
   - System checks if account is locked
   - System verifies password is set

2. **Step 2: Email and Password Authentication**
   - User enters email and password
   - System validates credentials
   - On success: User is logged in and redirected to home page
   - On failure: Login attempts are tracked, account may be locked after 5 failed attempts

### Security Features

- **Password Hashing**: Passwords are hashed using SHA256 with random salt
- **Account Lockout**: After 5 failed login attempts, account is locked for 30 minutes
- **Login Attempt Tracking**: System tracks number of failed login attempts
- **Password Change Tracking**: System tracks when passwords were last changed
- **Force Password Change**: Admins can flag accounts to require password change on next login

## Database Changes

### New Columns in Users Table

```sql
PasswordHash NVARCHAR(256) NULL        -- Hashed password
PasswordSalt NVARCHAR(256) NULL        -- Random salt for password hashing
PasswordChangedDate DATETIME2 NULL     -- Date password was last changed
RequirePasswordChange BIT DEFAULT 0    -- Flag to force password change
```

### Running the Database Migration

Execute the SQL script:
```
Career_Management.Server/Database_info/Add_Password_Authentication.sql
```

This script will:
- Add password-related columns to the Users table
- Preserve existing user data
- Display current users and their password status

## Backend Implementation

### New Controller: AuthenticationController

Location: `Career_Management.Server/Controllers/AuthenticationController.cs`

#### Endpoints

**1. Verify Employee Code**
```
POST /api/Authentication/verify-employee-code
Body: { "employeeCode": "EMP001" }

Response:
{
  "success": true,
  "employeeID": 1,
  "employeeCode": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@company.com",
  "positionTitle": "Software Engineer",
  "requirePasswordChange": false
}
```

**2. Login**
```
POST /api/Authentication/login
Body: { 
  "email": "john.doe@company.com", 
  "password": "YourPassword123!" 
}

Response (Success):
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userID": 1,
    "employeeID": 1,
    "employeeCode": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "positionTitle": "Software Engineer",
    "departmentName": "IT",
    "isSystemAdmin": false,
    "requirePasswordChange": false
  }
}

Response (Failure):
{
  "success": false,
  "message": "Invalid email or password. 4 attempt(s) remaining.",
  "attemptsRemaining": 4
}
```

**3. Set Password**
```
POST /api/Authentication/set-password
Body: { 
  "employeeID": 1,
  "oldPassword": "CurrentPassword123!",
  "newPassword": "NewPassword123!" 
}

Response:
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Frontend Implementation

### Updated Login Page

Location: `career_management.client/src/pages/Login.tsx`

#### Features

- **Two-Step Process**: 
  - Step 1: Employee code entry
  - Step 2: Email and password entry
- **Visual Step Indicator**: Shows progress through login flow
- **Pre-filled Email**: Email is pre-filled from employee record
- **Back Navigation**: Users can go back to change employee code
- **Error Handling**: Clear error messages for various failure scenarios
- **Account Lockout Display**: Shows remaining time when account is locked

## Setting Up User Passwords

### For New Users

When creating a new user account, use the Set Password endpoint:

```typescript
// Example API call
await fetch('/api/Authentication/set-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeID: 123,
    newPassword: 'InitialPassword123!'
  })
});
```

### For Existing Users

Existing users need passwords set. Options:

1. **Admin Portal**: Create an admin interface to set initial passwords
2. **Direct SQL**: Update passwords directly (requires hashing)
3. **Password Reset Flow**: Implement a "forgot password" feature
4. **Temporary Password**: Generate and email temporary passwords

### Password Requirements

- Minimum 8 characters
- Should include mix of uppercase, lowercase, numbers, and special characters
- Stored as SHA256 hash with salt

## Testing the Implementation

### Test User Setup

1. **Run the database migration script**
   ```sql
   -- Execute: Add_Password_Authentication.sql
   ```

2. **Create a test user with password**
   ```http
   POST /api/Authentication/set-password
   {
     "employeeID": 1,
     "newPassword": "TestPassword123!"
   }
   ```

3. **Test the login flow**
   - Navigate to `/login`
   - Enter employee code
   - Enter email and password
   - Verify successful login

### Test Scenarios

1. ✅ **Valid Login**: Enter correct employee code, email, and password
2. ✅ **Invalid Employee Code**: Enter non-existent employee code
3. ✅ **Invalid Password**: Enter wrong password (track attempts)
4. ✅ **Account Lockout**: Fail 5 times, verify 30-minute lockout
5. ✅ **No Password Set**: Try to login with user that has no password
6. ✅ **Inactive Account**: Try to login with inactive user

## Migration Strategy

### Migrating from Okta-Only to Password Authentication

1. **Phase 1: Add Password Support**
   - Run database migration
   - Deploy new authentication controller
   - Keep Okta login as alternative option

2. **Phase 2: Set User Passwords**
   - Send password setup emails to all users
   - Provide self-service password setup page
   - Set flag `RequirePasswordChange = 1` for all users

3. **Phase 3: Gradual Rollout**
   - Both login methods available
   - Monitor usage and issues
   - Gather user feedback

4. **Phase 4: Full Deployment** (Optional)
   - Make password login primary method
   - Keep Okta as SSO backup option

## Security Considerations

### Current Implementation

- ✅ Password hashing with SHA256
- ✅ Random salt per password
- ✅ Account lockout after failed attempts
- ✅ Login attempt tracking
- ✅ Password change history

### Recommended Enhancements

- 🔄 Use BCrypt instead of SHA256 (stronger hashing)
- 🔄 Implement password strength requirements
- 🔄 Add password expiration policy
- 🔄 Implement "forgot password" functionality
- 🔄 Add email verification
- 🔄 Implement 2FA (Two-Factor Authentication)
- 🔄 Add IP address tracking in audit logs
- 🔄 Implement session management with tokens (JWT)

## Troubleshooting

### Common Issues

**Issue**: "Account password not set"
- **Solution**: Use the set-password endpoint to create a password for the user

**Issue**: "Account locked"
- **Solution**: Wait 30 minutes or manually unlock via SQL:
  ```sql
  UPDATE Users 
  SET IsLocked = 0, LockoutEndDate = NULL, LoginAttempts = 0 
  WHERE UserID = [user_id]
  ```

**Issue**: "No user account found for this employee"
- **Solution**: Create a User record for the employee:
  ```sql
  INSERT INTO Users (EmployeeID, Username, IsActive)
  VALUES ([employee_id], '[employee_email]', 1)
  ```

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/Authentication/verify-employee-code` | POST | Verify employee code exists |
| `/api/Authentication/login` | POST | Authenticate with email/password |
| `/api/Authentication/set-password` | POST | Set or change user password |

### Error Codes

| Status | Message | Description |
|--------|---------|-------------|
| 400 | Employee code is required | Missing employee code |
| 404 | Employee code not found | Invalid employee code |
| 404 | No user account found | Employee has no user account |
| 401 | Invalid email or password | Wrong credentials |
| 400 | Account locked | Too many failed attempts |
| 400 | Account password not set | Password needs to be set |

## Files Modified/Created

### Backend
- ✅ `Career_Management.Server/Models/User.cs` - Added password fields
- ✅ `Career_Management.Server/Controllers/AuthenticationController.cs` - New controller
- ✅ `Career_Management.Server/Database_info/Add_Password_Authentication.sql` - Migration script

### Frontend
- ✅ `career_management.client/src/pages/Login.tsx` - Updated for two-step login

### Documentation
- ✅ `README_Password_Authentication.md` - This file

## Future Enhancements

1. **Password Management Page**: Allow users to change their password
2. **Forgot Password**: Email-based password reset
3. **Password Strength Indicator**: Visual feedback on password strength
4. **Admin User Management**: Interface to manage user passwords
5. **Session Management**: Implement JWT tokens for API authentication
6. **Audit Trail**: Enhanced logging of authentication events
7. **Multi-Factor Authentication**: Add 2FA support

## Support

For questions or issues with the authentication system:
- Check the troubleshooting section above
- Review server logs: `Career_Management.Server/logs`
- Contact IT support team

---

**Last Updated**: October 1, 2025
**Version**: 1.0

