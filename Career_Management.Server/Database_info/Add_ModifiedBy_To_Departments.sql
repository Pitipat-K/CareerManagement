-- Add ModifiedBy column to Departments table
-- This script adds the ModifiedBy column to track which employee last modified department records

-- Add ModifiedBy column to Departments table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Departments' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE Departments 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE Departments 
    ADD CONSTRAINT FK_Departments_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_Departments_ModifiedBy ON Departments(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to Departments table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in Departments table';
END

-- Add ModifiedDate column if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Departments' AND COLUMN_NAME = 'ModifiedDate')
BEGIN
    ALTER TABLE Departments 
    ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'Added ModifiedDate column to Departments table';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in Departments table';
END
