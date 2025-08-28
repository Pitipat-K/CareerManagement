-- Add Sample Assessments and Competency Scores for Radar Chart
-- This script adds sample assessment data so the Organization Competency radar chart can display meaningful data

USE CareerManagementDB;
GO

-- Insert a default assessor if it doesn't exist
IF NOT EXISTS (SELECT * FROM Employees WHERE EmployeeID = 100)
BEGIN
    INSERT INTO Employees (EmployeeCode, FirstName, LastName, PositionID, DateOfBirth, Gender, Phone, Email, HireDate, IsActive, CreatedDate, ModifiedDate) VALUES
    ('EMP100', 'System', 'Assessor', 5, '1980-01-01', 'Male', '+1000000000', 'system.assessor@techcorp.com', '2020-01-01', 1, GETDATE(), GETDATE());
    PRINT 'Default assessor inserted successfully.';
END

-- Insert sample assessments if they don't exist
IF NOT EXISTS (SELECT * FROM Assessments WHERE AssessmentID = 1)
BEGIN
    INSERT INTO Assessments (EmployeeID, AssessorID, AssessmentDate, AssessmentPeriod, Status, AssessmentType, IsActive, CreatedDate, ModifiedDate) VALUES
    -- Assessment for John Doe (Software Developer)
    (1, 100, '2024-01-15', 'Q1 2024', 'Completed', 'Annual Review', 1, GETDATE(), GETDATE()),
    -- Assessment for Jane Smith (Data Scientist)
    (2, 100, '2024-01-20', 'Q1 2024', 'Completed', 'Annual Review', 1, GETDATE(), GETDATE()),
    -- Assessment for Mike Johnson (Product Manager)
    (3, 100, '2024-01-25', 'Q1 2024', 'Completed', 'Annual Review', 1, GETDATE(), GETDATE());
    
    PRINT 'Sample assessments inserted successfully.';
END

-- Insert sample competency scores if they don't exist
IF NOT EXISTS (SELECT * FROM CompetencyScores WHERE ScoreID = 1)
BEGIN
    -- John Doe's competency scores (Software Developer)
    INSERT INTO CompetencyScores (AssessmentID, CompetencyID, CurrentLevel, Comments, IsActive, CreatedDate, ModifiedDate) VALUES
    -- Technical Skills Domain
    (1, 1, 3, 'Good JavaScript skills, can work independently', 1, GETDATE(), GETDATE()), -- JavaScript Level 3
    (1, 2, 2, 'Basic Python knowledge, needs improvement', 1, GETDATE(), GETDATE()), -- Python Level 2
    (1, 4, 2, 'Understands system design concepts', 1, GETDATE(), GETDATE()), -- System Design Level 2
    (1, 17, 2, 'Clear written communication', 1, GETDATE(), GETDATE()); -- Written Communication Level 2
    
    -- Jane Smith's competency scores (Data Scientist)
    INSERT INTO CompetencyScores (AssessmentID, CompetencyID, CurrentLevel, Comments, IsActive, CreatedDate, ModifiedDate) VALUES
    -- Technical Skills Domain
    (2, 2, 4, 'Excellent Python skills', 1, GETDATE(), GETDATE()), -- Python Level 4
    (2, 6, 4, 'Creates compelling data visualizations', 1, GETDATE(), GETDATE()), -- Data Visualization Level 4
    (2, 7, 3, 'Good statistical analysis skills', 1, GETDATE(), GETDATE()), -- Statistical Analysis Level 3
    (2, 17, 3, 'Strong written communication', 1, GETDATE(), GETDATE()); -- Written Communication Level 3
    
    -- Mike Johnson's competency scores (Product Manager)
    INSERT INTO CompetencyScores (AssessmentID, CompetencyID, CurrentLevel, Comments, IsActive, CreatedDate, ModifiedDate) VALUES
    -- Business Acumen Domain
    (3, 6, 4, 'Excellent market research skills', 1, GETDATE(), GETDATE()), -- Market Research Level 4
    (3, 7, 3, 'Good budget management', 1, GETDATE(), GETDATE()), -- Budget Management Level 3
    -- Communication Domain
    (3, 8, 4, 'Outstanding public speaking', 1, GETDATE(), GETDATE()), -- Public Speaking Level 4
    (3, 17, 4, 'Exceptional written communication', 1, GETDATE(), GETDATE()); -- Written Communication Level 4
    
    PRINT 'Sample competency scores inserted successfully.';
END

-- Add more employees with different competency levels to show variety in the radar chart
IF NOT EXISTS (SELECT * FROM Employees WHERE EmployeeID = 4)
BEGIN
    INSERT INTO Employees (EmployeeCode, FirstName, LastName, PositionID, DateOfBirth, Gender, Phone, Email, HireDate, IsActive, CreatedDate, ModifiedDate) VALUES
    ('EMP004', 'Sarah', 'Wilson', 3, '1987-03-10', 'Female', '+1234567893', 'sarah.wilson@techcorp.com', '2021-09-15', 1, GETDATE(), GETDATE()),
    ('EMP005', 'David', 'Brown', 8, '1983-11-28', 'Male', '+1234567894', 'david.brown@techcorp.com', '2020-07-22', 1, GETDATE(), GETDATE()),
    ('EMP006', 'Lisa', 'Garcia', 13, '1989-06-14', 'Female', '+1234567895', 'lisa.garcia@techcorp.com', '2022-03-08', 1, GETDATE(), GETDATE());
    
    PRINT 'Additional sample employees inserted successfully.';
END

-- Add assessments for the new employees
IF NOT EXISTS (SELECT * FROM Assessments WHERE AssessmentID = 4)
BEGIN
    INSERT INTO Assessments (EmployeeID, AssessorID, AssessmentDate, AssessmentPeriod, Status, AssessmentType, IsActive, CreatedDate, ModifiedDate) VALUES
    (4, 100, '2024-01-30', 'Q1 2024', 'Completed', 'Annual Review', 1, GETDATE(), GETDATE()),
    (5, 100, '2024-02-05', 'Q1 2024', 'Completed', 'Annual Review', 1, GETDATE(), GETDATE()),
    (6, 100, '2024-02-10', 'Q1 2024', 'Completed', 'Annual Review', 1, GETDATE(), GETDATE());
    
    PRINT 'Additional assessments inserted successfully.';
END

-- Add competency scores for the new employees to show different achievement levels
IF NOT EXISTS (SELECT * FROM CompetencyScores WHERE ScoreID = 17)
BEGIN
    -- Sarah Wilson's scores (Senior Software Developer)
    INSERT INTO CompetencyScores (AssessmentID, CompetencyID, CurrentLevel, Comments, IsActive, CreatedDate, ModifiedDate) VALUES
    (4, 1, 4, 'Expert JavaScript skills', 1, GETDATE(), GETDATE()), -- JavaScript Level 4
    (4, 4, 4, 'Excellent system design skills', 1, GETDATE(), GETDATE()), -- System Design Level 4
    (4, 8, 3, 'Good team building abilities', 1, GETDATE(), GETDATE()), -- Team Building Level 3
    (4, 17, 3, 'Strong communication skills', 1, GETDATE(), GETDATE()); -- Written Communication Level 3
    
    -- David Brown's scores (Senior Data Scientist)
    INSERT INTO CompetencyScores (AssessmentID, CompetencyID, CurrentLevel, Comments, IsActive, CreatedDate, ModifiedDate) VALUES
    (5, 2, 4, 'Master Python developer', 1, GETDATE(), GETDATE()), -- Python Level 4
    (5, 6, 4, 'Creates stunning visualizations', 1, GETDATE(), GETDATE()), -- Data Visualization Level 4
    (5, 8, 4, 'Excellent team leadership', 1, GETDATE(), GETDATE()), -- Team Building Level 4
    (5, 17, 4, 'Outstanding communication', 1, GETDATE(), GETDATE()); -- Written Communication Level 4
    
    -- Lisa Garcia's scores (Marketing Manager)
    INSERT INTO CompetencyScores (AssessmentID, CompetencyID, CurrentLevel, Comments, IsActive, CreatedDate, ModifiedDate) VALUES
    (6, 6, 3, 'Good market research skills', 1, GETDATE(), GETDATE()), -- Market Research Level 3
    (6, 8, 4, 'Excellent public speaking', 1, GETDATE(), GETDATE()), -- Public Speaking Level 4
    (6, 9, 3, 'Good negotiation skills', 1, GETDATE(), GETDATE()), -- Negotiation Level 3
    (6, 17, 4, 'Exceptional written communication', 1, GETDATE(), GETDATE()); -- Written Communication Level 4
    
    PRINT 'Additional competency scores inserted successfully.';
END

PRINT '';
PRINT 'Sample assessment data setup completed successfully!';
PRINT '';
PRINT 'Sample data includes:';
PRINT '- 6 Sample employees across different positions';
PRINT '- 6 Assessments (Q1 2024 Annual Reviews)';
PRINT '- 24 Competency scores across different domains';
PRINT '- Varied achievement levels to demonstrate radar chart functionality';
PRINT '';
PRINT 'The Organization Competency radar chart should now display meaningful data showing:';
PRINT '- Technical Skills domain achievement percentages';
PRINT '- Leadership domain achievement percentages';
PRINT '- Business Acumen domain achievement percentages';
PRINT '- Communication domain achievement percentages';
PRINT '';
PRINT 'You can now test the Organization Competency feature with this sample data.';
