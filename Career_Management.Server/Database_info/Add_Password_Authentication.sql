-- =============================================
-- Add Password Authentication to Users Table
-- Description: Adds password hash field to support email/password authentication
-- Date: 2024
-- =============================================

USE [Career_Management_DB]
GO

PRINT 'Starting password authentication schema update...';
GO

-- Add PasswordHash column to Users table if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'PasswordHash')
BEGIN
    PRINT 'Adding PasswordHash column to Users table...';
    
    ALTER TABLE Users
    ADD PasswordHash NVARCHAR(256) NULL; -- NULL to allow existing users without passwords
    
    PRINT 'PasswordHash column added successfully.';
END
ELSE
BEGIN
    PRINT 'PasswordHash column already exists.';
END
GO

-- Add PasswordSalt column for additional security (optional but recommended)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'PasswordSalt')
BEGIN
    PRINT 'Adding PasswordSalt column to Users table...';
    
    ALTER TABLE Users
    ADD PasswordSalt NVARCHAR(256) NULL;
    
    PRINT 'PasswordSalt column added successfully.';
END
ELSE
BEGIN
    PRINT 'PasswordSalt column already exists.';
END
GO

-- Add PasswordChangedDate column to track password changes
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'PasswordChangedDate')
BEGIN
    PRINT 'Adding PasswordChangedDate column to Users table...';
    
    ALTER TABLE Users
    ADD PasswordChangedDate DATETIME2 NULL;
    
    PRINT 'PasswordChangedDate column added successfully.';
END
ELSE
BEGIN
    PRINT 'PasswordChangedDate column already exists.';
END
GO

-- Add RequirePasswordChange flag for forcing password reset
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Users') AND name = 'RequirePasswordChange')
BEGIN
    PRINT 'Adding RequirePasswordChange column to Users table...';
    
    ALTER TABLE Users
    ADD RequirePasswordChange BIT DEFAULT 0 NOT NULL;
    
    PRINT 'RequirePasswordChange column added successfully.';
END
ELSE
BEGIN
    PRINT 'RequirePasswordChange column already exists.';
END
GO

PRINT 'Password authentication schema update completed successfully.';
GO

-- =============================================
-- SAMPLE: Create a test user with password
-- =============================================
-- Note: This is commented out. You should use the application to create users with passwords.
-- The password should be hashed using BCrypt or similar algorithm in the application code.

/*
-- Example: Create a test user (assuming EmployeeID 1 exists)
-- Password: "TestPassword123!" (This should be hashed in real implementation)

IF NOT EXISTS (SELECT 1 FROM Users WHERE EmployeeID = 1)
BEGIN
    INSERT INTO Users (EmployeeID, Username, PasswordHash, PasswordSalt, IsSystemAdmin, IsActive, CreatedDate, ModifiedDate, RequirePasswordChange)
    VALUES (1, 'test.user@company.com', 'HASHED_PASSWORD_HERE', 'SALT_HERE', 0, 1, GETDATE(), GETDATE(), 0);
    
    PRINT 'Test user created.';
END
*/

GO

-- =============================================
-- View all users (for verification)
-- =============================================
SELECT 
    u.UserID,
    u.EmployeeID,
    u.Username,
    e.FirstName,
    e.LastName,
    e.Email,
    e.EmployeeCode,
    u.IsSystemAdmin,
    u.IsActive,
    u.IsLocked,
    u.LastLoginDate,
    CASE 
        WHEN u.PasswordHash IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS HasPassword,
    u.RequirePasswordChange
FROM Users u
INNER JOIN Employees e ON u.EmployeeID = e.EmployeeID
WHERE u.IsActive = 1
ORDER BY u.CreatedDate DESC;
GO

