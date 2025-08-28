-- Create CompetencySets table for Career Management System
-- This script creates the competency sets functionality

-- Create CompetencySets table
CREATE TABLE CompetencySets (
    SetID INT IDENTITY(1,1) PRIMARY KEY,
    SetName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    IsPublic BIT DEFAULT 0,
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (CreatedBy) REFERENCES Employees(EmployeeID)
);

-- Create CompetencySetItems table to store competencies within each set
CREATE TABLE CompetencySetItems (
    ItemID INT IDENTITY(1,1) PRIMARY KEY,
    SetID INT NOT NULL,
    CompetencyID INT NOT NULL,
    RequiredLevel INT NOT NULL DEFAULT 1,
    IsMandatory BIT DEFAULT 1,
    DisplayOrder INT DEFAULT 0,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SetID) REFERENCES CompetencySets(SetID),
    FOREIGN KEY (CompetencyID) REFERENCES Competencies(CompetencyID),
    UNIQUE (SetID, CompetencyID)
);

-- Insert sample competency sets (assuming EmployeeID 1 exists)
-- Note: Update the CreatedBy value to match an existing employee in your system
INSERT INTO CompetencySets (SetName, Description, IsPublic, CreatedBy, CreatedDate, ModifiedDate, IsActive) VALUES
('Software Development Core', 'Essential competencies for software developers including programming, testing, and design principles', 1, 1, GETDATE(), GETDATE(), 1),
('Leadership Fundamentals', 'Basic leadership competencies for managers and team leads', 1, 1, GETDATE(), GETDATE(), 1),
('Project Management Essentials', 'Core project management competencies for project managers and coordinators', 1, 1, GETDATE(), GETDATE(), 1),
('Data Analysis Skills', 'Key competencies for data analysts and business intelligence professionals', 1, 1, GETDATE(), GETDATE(), 1),
('Customer Service Excellence', 'Essential competencies for customer-facing roles', 1, 1, GETDATE(), GETDATE(), 1);

-- Insert sample competency set items for Software Development Core
-- Note: Update CompetencyID values to match existing competencies in your system
-- This is a sample - you'll need to adjust based on your actual competency data
INSERT INTO CompetencySetItems (SetID, CompetencyID, RequiredLevel, IsMandatory, DisplayOrder, CreatedDate) VALUES
(1, 1, 3, 1, 1, GETDATE()),  -- Programming Fundamentals - Level 3, Mandatory
(1, 2, 2, 1, 2, GETDATE()),  -- Software Testing - Level 2, Mandatory
(1, 3, 2, 1, 3, GETDATE()),  -- Database Design - Level 2, Mandatory
(1, 4, 1, 0, 4, GETDATE()),  -- Version Control - Level 1, Optional
(1, 5, 2, 1, 5, GETDATE());  -- Agile Methodologies - Level 2, Mandatory

-- Insert sample competency set items for Leadership Fundamentals
INSERT INTO CompetencySetItems (SetID, CompetencyID, RequiredLevel, IsMandatory, DisplayOrder, CreatedDate) VALUES
(2, 6, 3, 1, 1, GETDATE()),  -- Team Management - Level 3, Mandatory
(2, 7, 2, 1, 2, GETDATE()),  -- Communication - Level 2, Mandatory
(2, 8, 2, 1, 3, GETDATE()),  -- Decision Making - Level 2, Mandatory
(2, 9, 1, 0, 4, GETDATE()),  -- Conflict Resolution - Level 1, Optional
(2, 10, 2, 1, 5, GETDATE()); -- Strategic Thinking - Level 2, Mandatory

-- Create indexes for better performance
CREATE INDEX IX_CompetencySets_CreatedBy ON CompetencySets(CreatedBy);
CREATE INDEX IX_CompetencySets_IsPublic ON CompetencySets(IsPublic);
CREATE INDEX IX_CompetencySets_IsActive ON CompetencySets(IsActive);
CREATE INDEX IX_CompetencySetItems_SetID ON CompetencySetItems(SetID);
CREATE INDEX IX_CompetencySetItems_CompetencyID ON CompetencySetItems(CompetencyID);

-- Add comments for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Stores competency sets that can be applied to positions',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'CompetencySets';

EXEC sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'Stores individual competencies within each competency set',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'CompetencySetItems';

-- Note: After running this script, you may need to:
-- 1. Update the CreatedBy values to match existing employees in your system
-- 2. Update the CompetencyID values to match existing competencies in your system
-- 3. Run the application to test the functionality
