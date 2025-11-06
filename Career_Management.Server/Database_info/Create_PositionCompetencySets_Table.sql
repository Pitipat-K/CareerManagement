-- =============================================
-- Create PositionCompetencySets Table
-- Purpose: Track assignment of positions to competency sets
-- with sync status monitoring
-- =============================================

USE [CareerManagement]
GO

-- Check if table already exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PositionCompetencySets')
BEGIN
    CREATE TABLE PositionCompetencySets (
        AssignmentID INT IDENTITY(1,1) PRIMARY KEY,
        PositionID INT NOT NULL,
        SetID INT NOT NULL,
        AssignedDate DATETIME2 DEFAULT GETDATE() NOT NULL,
        AssignedBy INT NOT NULL,
        LastSyncedDate DATETIME2 DEFAULT GETDATE() NOT NULL,
        SetVersionHash NVARCHAR(64) NOT NULL, -- SHA256 hash of set items
        IsSynced BIT DEFAULT 1 NOT NULL, -- TRUE if position is in sync with set
        IsActive BIT DEFAULT 1 NOT NULL,
        CreatedDate DATETIME2 DEFAULT GETDATE() NOT NULL,
        ModifiedDate DATETIME2 DEFAULT GETDATE() NOT NULL,
        ModifiedBy INT,
        
        -- Foreign key constraints
        CONSTRAINT FK_PositionCompetencySets_Position FOREIGN KEY (PositionID) 
            REFERENCES Positions(PositionID),
        CONSTRAINT FK_PositionCompetencySets_CompetencySet FOREIGN KEY (SetID) 
            REFERENCES CompetencySets(SetID),
        CONSTRAINT FK_PositionCompetencySets_AssignedBy FOREIGN KEY (AssignedBy) 
            REFERENCES Employees(EmployeeID),
        CONSTRAINT FK_PositionCompetencySets_ModifiedBy FOREIGN KEY (ModifiedBy) 
            REFERENCES Employees(EmployeeID),
        
        -- Unique constraint to prevent duplicate assignments
        CONSTRAINT UQ_PositionCompetencySets_Position_Set UNIQUE (PositionID, SetID)
    );

    -- Create indexes for better query performance
    CREATE INDEX IX_PositionCompetencySets_PositionID ON PositionCompetencySets(PositionID);
    CREATE INDEX IX_PositionCompetencySets_SetID ON PositionCompetencySets(SetID);
    CREATE INDEX IX_PositionCompetencySets_IsSynced ON PositionCompetencySets(IsSynced);
    CREATE INDEX IX_PositionCompetencySets_IsActive ON PositionCompetencySets(IsActive);

    PRINT 'PositionCompetencySets table created successfully.';
END
ELSE
BEGIN
    PRINT 'PositionCompetencySets table already exists. Skipping creation.';
END
GO

