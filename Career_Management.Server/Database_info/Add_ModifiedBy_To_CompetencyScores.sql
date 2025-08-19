-- Add ModifiedBy column to CompetencyScores table
-- This script adds the ModifiedBy column to track which employee last modified competency score records

-- Add ModifiedBy column to CompetencyScores table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyScores' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE CompetencyScores 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE CompetencyScores 
    ADD CONSTRAINT FK_CompetencyScores_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_CompetencyScores_ModifiedBy ON CompetencyScores(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to CompetencyScores table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in CompetencyScores table';
END

-- Add CreatedDate and ModifiedDate columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyScores' AND COLUMN_NAME = 'CreatedDate')
BEGIN
    ALTER TABLE CompetencyScores 
    ADD CreatedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added CreatedDate column to CompetencyScores table';
END
ELSE
BEGIN
    PRINT 'CreatedDate column already exists in CompetencyScores table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'CompetencyScores' AND COLUMN_NAME = 'ModifiedDate')
BEGIN
    ALTER TABLE CompetencyScores 
    ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added ModifiedDate column to CompetencyScores table';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in CompetencyScores table';
END
