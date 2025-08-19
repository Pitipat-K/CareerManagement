-- Setup Database for Career Management System
-- Run this script to create the database and all tables

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'CareerManagementDB')
BEGIN
    CREATE DATABASE CareerManagementDB;
END
GO

USE CareerManagementDB;
GO

-- Check if tables exist and create them if they don't
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
BEGIN
    -- Create Companies table
    CREATE TABLE Companies (
        CompanyID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        DirectorID INT,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LeadershipLevel')
BEGIN
    -- Create LeadershipLevel table
    CREATE TABLE LeadershipLevel (
        LeadershipID INT IDENTITY(1,1) PRIMARY KEY,
        LevelName NVARCHAR(50) NOT NULL,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
BEGIN
    -- Create Departments table
    CREATE TABLE Departments (
        DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
        CompanyID INT,
        DepartmentName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        ManagerID INT,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Positions')
BEGIN
    -- Create Positions table
    CREATE TABLE Positions (
        PositionID INT IDENTITY(1,1) PRIMARY KEY,
        PositionTitle NVARCHAR(200) NOT NULL,
        PositionDescription NVARCHAR(1000),
        ExperienceRequirement INT,
        JobGroup NVARCHAR(100),
        JobFunction NVARCHAR(200),
        JobFamilyID INT,
        DepartmentID INT,
        JobGrade NVARCHAR(20),
        LeadershipID INT DEFAULT 1 NOT NULL,
        IsActive BIT DEFAULT 1,
        CreatedDate DATETIME2 DEFAULT GETDATE(),
        ModifiedDate DATETIME2 DEFAULT GETDATE(),
        Department NVARCHAR(200),
        JobFamily NVARCHAR(200),
        FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
        FOREIGN KEY (LeadershipID) REFERENCES LeadershipLevel(LeadershipID)
    );
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
END

-- Insert sample company if it doesn't exist
IF NOT EXISTS (SELECT * FROM Companies WHERE CompanyID = 1)
BEGIN
    INSERT INTO Companies (CompanyName, Description, IsActive, CreatedDate) VALUES
    ('Sample Company', 'A sample company for testing', 1, GETDATE());
END

-- Insert sample department if it doesn't exist
IF NOT EXISTS (SELECT * FROM Departments WHERE DepartmentID = 1)
BEGIN
    INSERT INTO Departments (CompanyID, DepartmentName, Description, IsActive, CreatedDate) VALUES
    (1, 'IT Department', 'Information Technology Department', 1, GETDATE());
END

-- Insert sample position if it doesn't exist
IF NOT EXISTS (SELECT * FROM Positions WHERE PositionID = 1)
BEGIN
    INSERT INTO Positions (PositionTitle, PositionDescription, DepartmentID, LeadershipID, IsActive, CreatedDate, ModifiedDate) VALUES
    ('Software Engineer', 'Develops software applications', 1, 1, 1, GETDATE(), GETDATE());
END

PRINT 'Database setup completed successfully!'; 