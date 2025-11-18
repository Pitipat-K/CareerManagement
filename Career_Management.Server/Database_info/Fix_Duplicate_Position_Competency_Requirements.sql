-- =============================================
-- Fix Duplicate PositionCompetencyRequirements
-- Identifies and removes duplicate active competency requirements
-- Keeps the most recent record for each Position-Competency pair
-- =============================================

USE [CareerManagementDB]
GO

-- Step 1: Identify duplicate records
PRINT '=== FINDING DUPLICATE RECORDS ==='
PRINT ''

SELECT 
    pcr.PositionID,
    p.PositionTitle,
    pcr.CompetencyID,
    c.CompetencyName,
    COUNT(*) as DuplicateCount,
    STRING_AGG(CAST(pcr.RequirementID AS VARCHAR), ', ') as RequirementIDs
FROM PositionCompetencyRequirements pcr
INNER JOIN Positions p ON pcr.PositionID = p.PositionID
INNER JOIN Competencies c ON pcr.CompetencyID = c.CompetencyID
WHERE pcr.IsActive = 1
GROUP BY 
    pcr.PositionID, 
    p.PositionTitle,
    pcr.CompetencyID,
    c.CompetencyName
HAVING COUNT(*) > 1
ORDER BY pcr.PositionID, pcr.CompetencyID;

DECLARE @DuplicateCount INT;
SELECT @DuplicateCount = COUNT(*)
FROM (
    SELECT PositionID, CompetencyID
    FROM PositionCompetencyRequirements
    WHERE IsActive = 1
    GROUP BY PositionID, CompetencyID
    HAVING COUNT(*) > 1
) AS Duplicates;

PRINT ''
PRINT 'Total position-competency pairs with duplicates: ' + CAST(@DuplicateCount AS VARCHAR);
PRINT ''

IF @DuplicateCount = 0
BEGIN
    PRINT 'No duplicates found. Database is clean!';
END
ELSE
BEGIN
    PRINT '=== FIXING DUPLICATES ==='
    PRINT 'Keeping the most recent record for each Position-Competency pair...'
    PRINT ''

    -- Step 2: Soft delete older duplicates (set IsActive = 0)
    -- Keep only the most recent record based on ModifiedDate, then CreatedDate
    ;WITH RankedRequirements AS (
        SELECT 
            RequirementID,
            PositionID,
            CompetencyID,
            ROW_NUMBER() OVER (
                PARTITION BY PositionID, CompetencyID 
                ORDER BY 
                    COALESCE(ModifiedDate, CreatedDate) DESC,
                    RequirementID DESC
            ) AS RowNum
        FROM PositionCompetencyRequirements
        WHERE IsActive = 1
    )
    UPDATE pcr
    SET 
        IsActive = 0,
        ModifiedDate = GETDATE(),
        ModifiedBy = NULL
    FROM PositionCompetencyRequirements pcr
    INNER JOIN RankedRequirements rr ON pcr.RequirementID = rr.RequirementID
    WHERE rr.RowNum > 1;

    DECLARE @RowsAffected INT = @@ROWCOUNT;
    
    PRINT CAST(@RowsAffected AS VARCHAR) + ' duplicate records have been deactivated (IsActive set to 0).';
    PRINT ''
    
    -- Step 3: Verify the fix
    PRINT '=== VERIFICATION ==='
    PRINT 'Checking for remaining duplicates...'
    PRINT ''
    
    SELECT 
        pcr.PositionID,
        p.PositionTitle,
        pcr.CompetencyID,
        c.CompetencyName,
        COUNT(*) as ActiveCount
    FROM PositionCompetencyRequirements pcr
    INNER JOIN Positions p ON pcr.PositionID = p.PositionID
    INNER JOIN Competencies c ON pcr.CompetencyID = c.CompetencyID
    WHERE pcr.IsActive = 1
    GROUP BY 
        pcr.PositionID, 
        p.PositionTitle,
        pcr.CompetencyID,
        c.CompetencyName
    HAVING COUNT(*) > 1;
    
    SELECT @DuplicateCount = COUNT(*)
    FROM (
        SELECT PositionID, CompetencyID
        FROM PositionCompetencyRequirements
        WHERE IsActive = 1
        GROUP BY PositionID, CompetencyID
        HAVING COUNT(*) > 1
    ) AS Duplicates;
    
    IF @DuplicateCount = 0
    BEGIN
        PRINT '✅ SUCCESS: All duplicates have been resolved!';
    END
    ELSE
    BEGIN
        PRINT '⚠️ WARNING: ' + CAST(@DuplicateCount AS VARCHAR) + ' duplicate(s) still exist.';
    END
END
GO

PRINT ''
PRINT '=== FIX COMPLETED ==='
PRINT 'Note: Duplicate records have been soft-deleted (IsActive = 0) rather than permanently removed.'
PRINT 'The most recent record for each Position-Competency pair has been kept active.'
GO

