-- Create JobFunctions table
CREATE TABLE JobFunctions (
    JobFunctionID INT IDENTITY(1,1) PRIMARY KEY,
    JobFunctionName NVARCHAR(200) NOT NULL,
    JobFunctionDescription NVARCHAR(500),
    DepartmentID INT,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedBy INT,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID)
);

-- Add JobFunctionID column to Positions table if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Positions' AND COLUMN_NAME = 'JobFunctionID')
BEGIN
    ALTER TABLE Positions ADD JobFunctionID INT;
    ALTER TABLE Positions ADD CONSTRAINT FK_Positions_JobFunctions FOREIGN KEY (JobFunctionID) REFERENCES JobFunctions(JobFunctionID);
END

-- Insert sample JobFunctions data
INSERT INTO JobFunctions (JobFunctionName, JobFunctionDescription, DepartmentID, IsActive) VALUES
('Software Development', 'Design, develop, and maintain software applications', NULL, 1),
('Data Analysis', 'Analyze data to provide insights and support decision making', NULL, 1),
('Project Management', 'Plan, execute, and monitor projects to achieve objectives', NULL, 1),
('Human Resources', 'Manage employee relations, recruitment, and HR policies', NULL, 1),
('Finance & Accounting', 'Manage financial records, budgets, and financial reporting', NULL, 1),
('Marketing', 'Develop and execute marketing strategies and campaigns', NULL, 1),
('Sales', 'Generate revenue through customer acquisition and relationship management', NULL, 1),
('Customer Support', 'Provide assistance and support to customers', NULL, 1),
('Quality Assurance', 'Ensure product quality through testing and validation', NULL, 1),
('Research & Development', 'Conduct research and develop new products or technologies', NULL, 1);

-- Create index for better performance
CREATE INDEX IX_JobFunctions_DepartmentID ON JobFunctions(DepartmentID);
CREATE INDEX IX_JobFunctions_IsActive ON JobFunctions(IsActive);
CREATE INDEX IX_Positions_JobFunctionID ON Positions(JobFunctionID);
