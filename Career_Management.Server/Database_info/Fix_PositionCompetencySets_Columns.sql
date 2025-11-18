-- =============================================
-- Fix PositionCompetencySets Table
-- Add ModifiedDate and ModifiedBy columns if missing
-- =============================================

USE [CareerManagementDB]
GO

-- Check and add ModifiedDate column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PositionCompetencySets' 
    AND COLUMN_NAME = 'ModifiedDate'
)
BEGIN
    ALTER TABLE PositionCompetencySets
    ADD ModifiedDate DATETIME2 NOT NULL DEFAULT GETDATE();
    
    PRINT 'ModifiedDate column added to PositionCompetencySets table.';
END
ELSE
BEGIN
    PRINT 'ModifiedDate column already exists in PositionCompetencySets table.';
END
GO

-- Check and add ModifiedBy column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PositionCompetencySets' 
    AND COLUMN_NAME = 'ModifiedBy'
)
BEGIN
    ALTER TABLE PositionCompetencySets
    ADD ModifiedBy INT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE PositionCompetencySets
    ADD CONSTRAINT FK_PositionCompetencySets_ModifiedBy 
    FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
    
    PRINT 'ModifiedBy column added to PositionCompetencySets table with foreign key constraint.';
END
ELSE
BEGIN
    PRINT 'ModifiedBy column already exists in PositionCompetencySets table.';
    
    -- Check if foreign key exists, if not add it
    IF NOT EXISTS (
        SELECT * FROM sys.foreign_keys 
        WHERE name = 'FK_PositionCompetencySets_ModifiedBy'
    )
    BEGIN
        ALTER TABLE PositionCompetencySets
        ADD CONSTRAINT FK_PositionCompetencySets_ModifiedBy 
        FOREIGN KEY (ModifiedBy) REFERENCES Employees(EmployeeID);
        
        PRINT 'Foreign key constraint FK_PositionCompetencySets_ModifiedBy added.';
    END
END
GO

-- Verify the columns exist
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'PositionCompetencySets'
AND COLUMN_NAME IN ('ModifiedDate', 'ModifiedBy')
ORDER BY ORDINAL_POSITION;
GO

PRINT 'Fix completed. Please verify the output above.';
GO

