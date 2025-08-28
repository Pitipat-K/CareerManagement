-- Add WorkerCategory column to Employees table
-- This script adds a new WorkerCategory field to store employee classification

-- Add WorkerCategory column if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'WorkerCategory')
BEGIN
    ALTER TABLE Employees ADD WorkerCategory NVARCHAR(50) NULL;
    PRINT 'WorkerCategory column added to Employees table';
END
ELSE
BEGIN
    PRINT 'WorkerCategory column already exists in Employees table';
END

-- Create index for better performance on WorkerCategory searches
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Employees_WorkerCategory')
BEGIN
    CREATE INDEX IX_Employees_WorkerCategory ON Employees(WorkerCategory);
    PRINT 'Index created on WorkerCategory column';
END
ELSE
BEGIN
    PRINT 'Index on WorkerCategory column already exists';
END

-- Update existing employees with default values (optional)
-- Uncomment the following lines if you want to set default values for existing employees
/*
UPDATE Employees 
SET WorkerCategory = 'White collar' 
WHERE WorkerCategory IS NULL;
PRINT 'Default WorkerCategory values set for existing employees';
*/

PRINT 'WorkerCategory column setup completed successfully!';
