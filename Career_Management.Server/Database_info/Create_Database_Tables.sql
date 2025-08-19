-- Create Database Tables for Career Management System
-- This script creates all necessary tables including the new LeadershipLevel table

-- Create Companies table
CREATE TABLE Companies (
    CompanyID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    DirectorID INT,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETDATE()
);

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

-- Create LeadershipLevel table
CREATE TABLE LeadershipLevels (
    LeadershipID INT IDENTITY(1,1) PRIMARY KEY,
    LevelName NVARCHAR(50) NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

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

-- Create Employees table
CREATE TABLE Employees (
    EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeCode NVARCHAR(20),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    PositionID INT NOT NULL,
    ManagerID INT,
    DateOfBirth DATE,
    Gender NVARCHAR(20),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    HireDate DATE,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (PositionID) REFERENCES Positions(PositionID),
    FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID)
);

-- Create CompetencyDomains table
CREATE TABLE CompetencyDomains (
    DomainID INT IDENTITY(1,1) PRIMARY KEY,
    DomainName NVARCHAR(200) NOT NULL,
    DomainDescription NVARCHAR(500),
    DisplayOrder INT,
    IsActive BIT DEFAULT 1
);

-- Create CompetencyCategories table
CREATE TABLE CompetencyCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    DomainID INT NOT NULL,
    CategoryName NVARCHAR(200) NOT NULL,
    CategoryDescription NVARCHAR(500),
    DisplayOrder INT,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (DomainID) REFERENCES CompetencyDomains(DomainID)
);

-- Create Competencies table
CREATE TABLE Competencies (
    CompetencyID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT NOT NULL,
    CompetencyName NVARCHAR(200) NOT NULL,
    CompetencyDescription NVARCHAR(1000),
    DisplayOrder INT,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (CategoryID) REFERENCES CompetencyCategories(CategoryID)
);

-- Create PositionCompetencyRequirements table
CREATE TABLE PositionCompetencyRequirements (
    RequirementID INT IDENTITY(1,1) PRIMARY KEY,
    PositionID INT NOT NULL,
    CompetencyID INT NOT NULL,
    RequiredLevel INT NOT NULL,
    IsMandatory BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedBy INT,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (PositionID) REFERENCES Positions(PositionID),
    FOREIGN KEY (CompetencyID) REFERENCES Competencies(CompetencyID),
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID),
    UNIQUE (PositionID, CompetencyID)
);

-- Create Assessments table
CREATE TABLE Assessments (
    AssessmentID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    AssessorID INT,
    AssessmentDate DATETIME2 DEFAULT GETDATE(),
    AssessmentPeriod NVARCHAR(50),
    Status NVARCHAR(50) DEFAULT 'In Progress',
    CreatedBy INT,
    AssessmentType NVARCHAR(20) DEFAULT 'Self' CHECK (AssessmentType IN ('Self', 'Manager', 'Peer')),
    RelatedAssessmentID INT,
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (AssessorID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (CreatedBy) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (RelatedAssessmentID) REFERENCES Assessments(AssessmentID)
);

-- Create AssessmentCycles table
CREATE TABLE AssessmentCycles (
    CycleID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    AssessmentPeriod NVARCHAR(50),
    SelfAssessmentID INT,
    ManagerAssessmentID INT,
    Status NVARCHAR(50) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Self_In_Progress', 'Manager_Notified', 'Manager_In_Progress', 'Completed', 'Cancelled')),
    CreatedBy INT,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    SelfCompletedDate DATETIME2,
    ManagerCompletedDate DATETIME2,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (SelfAssessmentID) REFERENCES Assessments(AssessmentID),
    FOREIGN KEY (ManagerAssessmentID) REFERENCES Assessments(AssessmentID),
    FOREIGN KEY (CreatedBy) REFERENCES Employees(EmployeeID)
);

-- Create CompetencyScores table
CREATE TABLE CompetencyScores (
    ScoreID INT IDENTITY(1,1) PRIMARY KEY,
    AssessmentID INT NOT NULL,
    CompetencyID INT NOT NULL,
    CurrentLevel INT NOT NULL,
    Comments NVARCHAR(1000),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (AssessmentID) REFERENCES Assessments(AssessmentID),
    FOREIGN KEY (CompetencyID) REFERENCES Competencies(CompetencyID),
    UNIQUE (AssessmentID, CompetencyID)
);

-- Insert default leadership levels
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

-- Insert sample company
INSERT INTO Companies (CompanyName, Description, IsActive, CreatedDate) VALUES
('Sample Company', 'A sample company for testing', 1, GETDATE());

-- Insert sample department
INSERT INTO Departments (CompanyID, DepartmentName, Description, IsActive, CreatedDate) VALUES
(1, 'IT Department', 'Information Technology Department', 1, GETDATE());

-- Insert sample position
INSERT INTO Positions (PositionTitle, PositionDescription, DepartmentID, LeadershipID, IsActive, CreatedDate, ModifiedDate) VALUES
('Software Engineer', 'Develops software applications', 1, 1, 1, GETDATE(), GETDATE()); 