-- Create view for Competency Progress
-- Shows Domain, Category, Competency with Assigned and Achieved counts
-- Assigned: Count of competencies assigned to positions
-- Achieved: Count of competencies that meet target level (CurrentLevel >= RequiredLevel) from Manager assessments

CREATE VIEW vw_CompetencyProgress AS
WITH LastManagerAssessments AS (
    -- Get the latest manager assessment for each employee
    SELECT 
        a.EmployeeID,
        a.AssessmentID,
        ROW_NUMBER() OVER (
            PARTITION BY a.EmployeeID 
            ORDER BY a.AssessmentDate DESC, a.AssessmentID DESC
        ) as rn
    FROM Assessments a
    WHERE a.AssessmentType = 'Manager' 
        AND a.IsActive = 1
        AND a.Status = 'Completed'
),
CompetencyAssignments AS (
    -- Count competencies assigned to positions
    SELECT 
        cd.DomainID,
        cd.DomainName,
        cc.CategoryID,
        cc.CategoryName,
        c.CompetencyID,
        c.CompetencyName,
        COUNT(DISTINCT pcr.PositionID) as AssignedCount
    FROM CompetencyDomains cd
    INNER JOIN CompetencyCategories cc ON cd.DomainID = cc.DomainID
    INNER JOIN Competencies c ON cc.CategoryID = c.CategoryID
    LEFT JOIN PositionCompetencyRequirements pcr ON c.CompetencyID = pcr.CompetencyID
        AND pcr.IsActive = 1
    WHERE cd.IsActive = 1 
        AND cc.IsActive = 1 
        AND c.IsActive = 1
    GROUP BY 
        cd.DomainID, cd.DomainName,
        cc.CategoryID, cc.CategoryName,
        c.CompetencyID, c.CompetencyName
),
CompetencyAchievements AS (
    -- Count competencies that meet target level from manager assessments
    SELECT 
        cd.DomainID,
        cd.DomainName,
        cc.CategoryID,
        cc.CategoryName,
        c.CompetencyID,
        c.CompetencyName,
        COUNT(DISTINCT e.EmployeeID) as AchievedCount
    FROM CompetencyDomains cd
    INNER JOIN CompetencyCategories cc ON cd.DomainID = cc.DomainID
    INNER JOIN Competencies c ON cc.CategoryID = c.CategoryID
    INNER JOIN PositionCompetencyRequirements pcr ON c.CompetencyID = pcr.CompetencyID
        AND pcr.IsActive = 1
    INNER JOIN Employees e ON pcr.PositionID = e.PositionID
        AND e.IsActive = 1
    INNER JOIN LastManagerAssessments lma ON e.EmployeeID = lma.EmployeeID
        AND lma.rn = 1
    INNER JOIN CompetencyScores cs ON lma.AssessmentID = cs.AssessmentID
        AND c.CompetencyID = cs.CompetencyID
        AND cs.IsActive = 1
    WHERE cd.IsActive = 1 
        AND cc.IsActive = 1 
        AND c.IsActive = 1
        AND cs.CurrentLevel >= pcr.RequiredLevel
    GROUP BY 
        cd.DomainID, cd.DomainName,
        cc.CategoryID, cc.CategoryName,
        c.CompetencyID, c.CompetencyName
)
SELECT 
    COALESCE(ca.DomainID, ca2.DomainID) as DomainID,
    COALESCE(ca.DomainName, ca2.DomainName) as Domain,
    COALESCE(ca.CategoryID, ca2.CategoryID) as CategoryID,
    COALESCE(ca.CategoryName, ca2.CategoryName) as Category,
    COALESCE(ca.CompetencyID, ca2.CompetencyID) as CompetencyID,
    COALESCE(ca.CompetencyName, ca2.CompetencyName) as Competency,
    ISNULL(ca.AssignedCount, 0) as Assigned,
    ISNULL(ca2.AchievedCount, 0) as Achieved
FROM CompetencyAssignments ca
FULL OUTER JOIN CompetencyAchievements ca2 
    ON ca.DomainID = ca2.DomainID 
    AND ca.CategoryID = ca2.CategoryID 
    AND ca.CompetencyID = ca2.CompetencyID
;

-- Example usage:
-- SELECT * FROM vw_CompetencyProgress;
-- 
-- To filter by specific domain:
-- SELECT * FROM vw_CompetencyProgress WHERE Domain = 'Technical Skills';
-- 
-- To see only competencies with achievements:
-- SELECT * FROM vw_CompetencyProgress WHERE Achieved > 0;
-- 
-- To see competency progress percentage:
-- SELECT 
--     Domain, Category, Competency, 
--     Assigned, Achieved,
--     CASE 
--         WHEN Assigned > 0 THEN CAST((Achieved * 100.0 / Assigned) AS DECIMAL(5,2))
--         ELSE 0 
--     END as ProgressPercentage
-- FROM vw_CompetencyProgress;
