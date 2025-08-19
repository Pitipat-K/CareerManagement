-- Add ModifiedBy functionality to EmployeeDevelopmentPlans table
-- This script is idempotent and can be run multiple times safely

-- Add ModifiedBy column to EmployeeDevelopmentPlans table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'EmployeeDevelopmentPlans' AND COLUMN_NAME = 'ModifiedBy')
BEGIN
    ALTER TABLE EmployeeDevelopmentPlans ADD ModifiedBy INT NULL;
    ALTER TABLE EmployeeDevelopmentPlans ADD CONSTRAINT FK_EmployeeDevelopmentPlans_ModifiedBy FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    CREATE INDEX IX_EmployeeDevelopmentPlans_ModifiedBy ON EmployeeDevelopmentPlans(ModifiedBy);
    PRINT 'Added ModifiedBy column to EmployeeDevelopmentPlans table';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in EmployeeDevelopmentPlans table';
END

-- Add CreatedDate and ModifiedDate columns if they don't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'EmployeeDevelopmentPlans' AND COLUMN_NAME = 'CreatedDate')
BEGIN
    ALTER TABLE EmployeeDevelopmentPlans ADD CreatedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    PRINT 'Added CreatedDate column to EmployeeDevelopmentPlans table';
END
ELSE
BEGIN
    PRINT 'CreatedDate column already exists in EmployeeDevelopmentPlans table';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'EmployeeDevelopmentPlans' AND COLUMN_NAME = 'ModifiedDate')
BEGIN
    ALTER TABLE EmployeeDevelopmentPlans ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    PRINT 'Added ModifiedDate column to EmployeeDevelopmentPlans table';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in EmployeeDevelopmentPlans table';
END
