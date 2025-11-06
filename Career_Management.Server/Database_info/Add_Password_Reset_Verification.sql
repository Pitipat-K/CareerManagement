-- =============================================
-- Add Password Reset Verification Table
-- Description: Stores verification codes for password reset
-- =============================================

USE [Career_Management_DB]
GO

-- Create PasswordResetVerification table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'PasswordResetVerifications')
BEGIN
    CREATE TABLE PasswordResetVerifications (
        VerificationID INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeID INT NOT NULL,
        VerificationCode NVARCHAR(10) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        ExpiryDate DATETIME2 NOT NULL,
        IsUsed BIT DEFAULT 0,
        UsedDate DATETIME2 NULL,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        IPAddress NVARCHAR(50) NULL,
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
    );
    
    -- Create index for faster lookups
    CREATE INDEX IX_PasswordReset_Code ON PasswordResetVerifications(VerificationCode, Email, IsUsed, IsActive);
    CREATE INDEX IX_PasswordReset_Employee ON PasswordResetVerifications(EmployeeID, IsActive);
    
    PRINT 'PasswordResetVerifications table created successfully.';
END
ELSE
BEGIN
    PRINT 'PasswordResetVerifications table already exists.';
END
GO

-- Clean up expired verification codes (optional - can be run as scheduled task)
CREATE OR ALTER PROCEDURE sp_CleanupExpiredVerificationCodes
AS
BEGIN
    DELETE FROM PasswordResetVerifications
    WHERE ExpiryDate < GETDATE() AND IsActive = 1;
    
    PRINT 'Expired verification codes cleaned up.';
END
GO

PRINT 'Password reset verification schema created successfully.';
GO

