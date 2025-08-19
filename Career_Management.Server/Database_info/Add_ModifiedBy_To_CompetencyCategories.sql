-- Add ModifiedBy column to CompetencyCategories table
-- This script adds the ModifiedBy column to track which employee last modified competency category records

-- Add ModifiedBy column to CompetencyCategories table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyCategories' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE CompetencyCategories 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE CompetencyCategories 
    ADD CONSTRAINT FK_CompetencyCategories_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_CompetencyCategories_ModifiedBy ON CompetencyCategories(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to CompetencyCategories table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in CompetencyCategories table';
END

-- Add CreatedDate and ModifiedDate columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyCategories' AND COLUMN_NAME = 'CreatedDate')
BEGIN
    ALTER TABLE CompetencyCategories 
    ADD CreatedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added CreatedDate column to CompetencyCategories table';
END
ELSE
BEGIN
    PRINT 'CreatedDate column already exists in CompetencyCategories table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyCategories' AND COLUMN_NAME = 'ModifiedDate')
BEGIN
    ALTER TABLE CompetencyCategories 
    ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added ModifiedDate column to CompetencyCategories table';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in CompetencyCategories table';
END
