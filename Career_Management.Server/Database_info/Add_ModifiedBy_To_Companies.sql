-- Add ModifiedBy column to Companies table
-- This script adds the ModifiedBy column to track which employee last modified company records

-- Add ModifiedBy column to Companies table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Companies' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE Companies 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE Companies 
    ADD CONSTRAINT FK_Companies_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_Companies_ModifiedBy ON Companies(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to Companies table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in Companies table';
END

-- Add ModifiedDate column if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Companies' AND COLUMN_NAME = 'ModifiedDate')
BEGIN
    ALTER TABLE Companies 
    ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added ModifiedDate column to Companies table';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in Companies table';
END
