-- Add ModifiedBy column to CompetencyDomains table
-- This script adds the ModifiedBy column to track which employee last modified competency domain records

-- Add ModifiedBy column to CompetencyDomains table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyDomains' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE CompetencyDomains 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE CompetencyDomains 
    ADD CONSTRAINT FK_CompetencyDomains_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_CompetencyDomains_ModifiedBy ON CompetencyDomains(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to CompetencyDomains table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in CompetencyDomains table';
END

-- Add CreatedDate and ModifiedDate columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyDomains' AND COLUMN_NAME = 'CreatedDate')
BEGIN
    ALTER TABLE CompetencyDomains 
    ADD CreatedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added CreatedDate column to CompetencyDomains table';
END
ELSE
BEGIN
    PRINT 'CreatedDate column already exists in CompetencyDomains table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyDomains' AND COLUMN_NAME = 'ModifiedDate')
BEGIN
    ALTER TABLE CompetencyDomains 
    ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added ModifiedDate column to CompetencyDomains table';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in CompetencyDomains table';
END
