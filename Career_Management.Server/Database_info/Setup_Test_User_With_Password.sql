-- =============================================
-- Setup Test User with Password
-- Description: Creates a test user account for testing password authentication
-- =============================================

USE [Career_Management_DB]
GO

PRINT 'Setting up test user for password authentication...';
GO

-- =============================================
-- STEP 1: Find or create a test employee
-- =============================================

DECLARE @TestEmployeeID INT;
DECLARE @TestEmail NVARCHAR(100) = 'test.user@alliancelaundry.com';
DECLARE @TestEmployeeCode NVARCHAR(20) = 'TEST001';

-- Check if test employee exists
SELECT @TestEmployeeID = EmployeeID 
FROM Employees 
WHERE EmployeeCode = @TestEmployeeCode OR Email = @TestEmail;

IF @TestEmployeeID IS NULL
BEGIN
    PRINT 'Test employee not found. You need to create a test employee first.';
    PRINT 'Please run the following SQL to create a test employee:';
    PRINT '';
    PRINT 'INSERT INTO Employees (EmployeeCode, FirstName, LastName, Email, PositionID, IsActive)';
    PRINT 'VALUES (''TEST001'', ''Test'', ''User'', ''test.user@alliancelaundry.com'', 1, 1)';
    PRINT '';
    PRINT 'Then run this script again.';
END
ELSE
BEGIN
    PRINT 'Found test employee: ' + CAST(@TestEmployeeID AS NVARCHAR(10));
    
    -- =============================================
    -- STEP 2: Create or update user account
    -- =============================================
    
    DECLARE @TestUserID INT;
    
    -- Check if user account exists
    SELECT @TestUserID = UserID 
    FROM Users 
    WHERE EmployeeID = @TestEmployeeID;
    
    IF @TestUserID IS NULL
    BEGIN
        -- Create new user account
        INSERT INTO Users (EmployeeID, Username, IsSystemAdmin, IsActive, CreatedDate, ModifiedDate)
        VALUES (@TestEmployeeID, @TestEmail, 0, 1, GETDATE(), GETDATE());
        
        SET @TestUserID = SCOPE_IDENTITY();
        PRINT 'Created new user account: UserID = ' + CAST(@TestUserID AS NVARCHAR(10));
    END
    ELSE
    BEGIN
        PRINT 'User account already exists: UserID = ' + CAST(@TestUserID AS NVARCHAR(10));
        
        -- Make sure account is active and unlocked
        UPDATE Users
        SET IsActive = 1,
            IsLocked = 0,
            LockoutEndDate = NULL,
            LoginAttempts = 0,
            ModifiedDate = GETDATE()
        WHERE UserID = @TestUserID;
        
        PRINT 'User account activated and unlocked.';
    END
    
    -- =============================================
    -- STEP 3: Display instructions for setting password
    -- =============================================
    
    PRINT '';
    PRINT '========================================';
    PRINT 'TEST USER SETUP COMPLETE';
    PRINT '========================================';
    PRINT '';
    PRINT 'Test User Details:';
    PRINT '  Employee Code: ' + @TestEmployeeCode;
    PRINT '  Email: ' + @TestEmail;
    PRINT '  Employee ID: ' + CAST(@TestEmployeeID AS NVARCHAR(10));
    PRINT '  User ID: ' + CAST(@TestUserID AS NVARCHAR(10));
    PRINT '';
    PRINT 'TO SET PASSWORD:';
    PRINT '1. Use the API endpoint:';
    PRINT '   POST /api/Authentication/set-password';
    PRINT '   Body: {';
    PRINT '     "employeeID": ' + CAST(@TestEmployeeID AS NVARCHAR(10)) + ',';
    PRINT '     "newPassword": "TestPassword123!"';
    PRINT '   }';
    PRINT '';
    PRINT '2. Or use this PowerShell command:';
    PRINT '   $body = @{';
    PRINT '       employeeID = ' + CAST(@TestEmployeeID AS NVARCHAR(10));
    PRINT '       newPassword = "TestPassword123!"';
    PRINT '   } | ConvertTo-Json';
    PRINT '   Invoke-RestMethod -Uri "https://localhost:7026/api/Authentication/set-password" -Method POST -Body $body -ContentType "application/json"';
    PRINT '';
    PRINT '3. Or use Postman/curl to call the endpoint';
    PRINT '';
    PRINT 'TESTING LOGIN:';
    PRINT '1. Go to the login page';
    PRINT '2. Enter Employee Code: ' + @TestEmployeeCode;
    PRINT '3. Enter Email: ' + @TestEmail;
    PRINT '4. Enter Password: TestPassword123!';
    PRINT '';
    PRINT '========================================';
END

GO

-- =============================================
-- Display all employees that could be used for testing
-- =============================================

PRINT '';
PRINT 'Available Employees for Testing:';
PRINT '========================================';

SELECT TOP 10
    e.EmployeeID,
    e.EmployeeCode,
    e.FirstName,
    e.LastName,
    e.Email,
    p.PositionTitle,
    CASE 
        WHEN u.UserID IS NOT NULL THEN 'Yes (UserID: ' + CAST(u.UserID AS NVARCHAR(10)) + ')'
        ELSE 'No'
    END AS HasUserAccount,
    CASE 
        WHEN u.PasswordHash IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END AS HasPassword,
    CASE 
        WHEN e.IsActive = 1 AND (u.IsActive IS NULL OR u.IsActive = 1) THEN 'Active'
        ELSE 'Inactive'
    END AS Status
FROM Employees e
LEFT JOIN Users u ON e.EmployeeID = u.EmployeeID
LEFT JOIN Positions p ON e.PositionID = p.PositionID
WHERE e.IsActive = 1
ORDER BY e.EmployeeCode;

GO

