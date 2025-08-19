-- Add ModifiedBy column to Positions and Employees tables
-- This script adds the ModifiedBy column to track which employee last modified position and employee records

-- Add ModifiedBy column to Positions table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Positions' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE Positions 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE Positions 
    ADD CONSTRAINT FK_Positions_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_Positions_ModifiedBy ON Positions(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to Positions table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in Positions table';
END

-- Add ModifiedBy column to Employees table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE Employees 
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint for ModifiedBy column
    ALTER TABLE Employees 
    ADD CONSTRAINT FK_Employees_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    -- Add index for better performance
    CREATE INDEX IX_Employees_ModifiedBy ON Employees(ModifiedBy);
    
    PRINT 'Added ModifiedBy column to Employees table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in Employees table';
END
