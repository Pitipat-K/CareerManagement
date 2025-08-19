-- Quick Setup for Career Management Database
-- Run this script in your SQL Server to create the missing tables

USE CareerManagementDB;
GO

-- Create LeadershipLevel table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LeadershipLevel')
BEGIN
    CREATE TABLE LeadershipLevel (
        LeadershipID INT IDENTITY(1,1) PRIMARY KEY,
        LevelName NVARCHAR(50) NOT NULL,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
    PRINT 'LeadershipLevel table created successfully.';
END
ELSE
BEGIN
    PRINT 'LeadershipLevel table already exists.';
END

-- Insert default leadership levels if they don't exist
IF NOT EXISTS (SELECT * FROM LeadershipLevel WHERE LeadershipID = 1)
BEGIN
    INSERT INTO LeadershipLevel (LevelName, CreatedDate, ModifiedDate, IsActive) VALUES
    ('Individual Contributor', GETDATE(), GETDATE(), 1),
    ('Team Lead', GETDATE(), GETDATE(), 1),
    ('Manager', GETDATE(), GETDATE(), 1),
    ('Senior Manager', GETDATE(), GETDATE(), 1),
    ('Director', GETDATE(), GETDATE(), 1),
    ('Senior Director', GETDATE(), GETDATE(), 1),
    ('Vice President', GETDATE(), GETDATE(), 1),
    ('Senior Vice President', GETDATE(), GETDATE(), 1),
    ('Executive Vice President', GETDATE(), GETDATE(), 1),
    ('Chief Executive Officer', GETDATE(), GETDATE(), 1);
    PRINT 'Default leadership levels inserted successfully.';
END
ELSE
BEGIN
    PRINT 'Default leadership levels already exist.';
END

-- Check if Positions table has LeadershipID column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Positions') AND name = 'LeadershipID')
BEGIN
    ALTER TABLE Positions ADD LeadershipID INT DEFAULT 1 NOT NULL;
    PRINT 'LeadershipID column added to Positions table.';
    
    -- Add foreign key constraint
    ALTER TABLE Positions ADD CONSTRAINT FK_Positions_LeadershipLevel 
    FOREIGN KEY (LeadershipID) REFERENCES LeadershipLevel(LeadershipID);
    PRINT 'Foreign key constraint added to Positions table.';
END
ELSE
BEGIN
    PRINT 'LeadershipID column already exists in Positions table.';
END

PRINT 'Quick setup completed successfully!'; 