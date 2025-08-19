-- Add ModifiedBy column to Competencies table
-- This script adds the ModifiedBy column to track which employee last modified competency records

-- Add ModifiedBy column to Competencies table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Competencies' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE Competencies 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE Competencies 
    ADD CONSTRAINT FK_Competencies_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_Competencies_ModifiedBy ON Competencies(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to Competencies table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in Competencies table';
END

-- Add CreatedDate and ModifiedDate columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Competencies' AND COLUMN_NAME = 'CreatedDate')
BEGIN
    ALTER TABLE Competencies 
    ADD CreatedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added CreatedDate column to Competencies table';
END
ELSE
BEGIN
    PRINT 'CreatedDate column already exists in Competencies table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Competencies' AND COLUMN_NAME = 'ModifiedDate')
BEGIN
    ALTER TABLE Competencies 
    ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added ModifiedDate column to Competencies table';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in Competencies table';
END
