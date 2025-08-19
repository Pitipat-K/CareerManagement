-- Add ModifiedBy column to Employees table
-- This script adds the ModifiedBy column to track which employee last modified an employee record

-- Add ModifiedBy column to Employees table
ALTER TABLE Employees 
ADD ModifiedBy INT NULL;

-- Add foreign key constraint for ModifiedBy column
ALTER TABLE Employees 
ADD CONSTRAINT FK_Employees_ModifiedBy 
FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);

-- Add index for better performance
CREATE INDEX IX_Employees_ModifiedBy ON Employees(ModifiedBy);
