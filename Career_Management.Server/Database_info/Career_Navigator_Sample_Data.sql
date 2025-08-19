-- Career Navigator Sample Data
-- This script adds sample data for testing the Career Navigator feature

USE CareerManagementDB;
GO

-- Insert sample companies if they don't exist
IF NOT EXISTS (SELECT * FROM Companies WHERE CompanyID = 1)
BEGIN
    INSERT INTO Companies (CompanyName, Description, IsActive, CreatedDate, ModifiedDate) VALUES
    ('TechCorp Solutions', 'Leading technology solutions provider', 1, GETDATE(), GETDATE());
    PRINT 'Sample company inserted successfully.';
END

-- Insert sample departments if they don't exist
IF NOT EXISTS (SELECT * FROM Departments WHERE DepartmentID = 1)
BEGIN
    INSERT INTO Departments (CompanyID, DepartmentName, Description, IsActive, CreatedDate, ModifiedDate) VALUES
    (1, 'Software Development', 'Core software development team', 1, GETDATE(), GETDATE()),
    (1, 'Data Science', 'Advanced analytics and machine learning', 1, GETDATE(), GETDATE()),
    (1, 'Product Management', 'Product strategy and roadmap', 1, GETDATE(), GETDATE()),
    (1, 'Marketing', 'Digital marketing and brand management', 1, GETDATE(), GETDATE()),
    (1, 'Sales', 'Customer acquisition and account management', 1, GETDATE(), GETDATE());
    PRINT 'Sample departments inserted successfully.';
END

-- Insert sample job grades if they don't exist
IF NOT EXISTS (SELECT * FROM JobGrades WHERE JobGradeID = 1)
BEGIN
    INSERT INTO JobGrades (JobGradeName, JobGradeDescription, JobGradeLevel, IsActive, CreatedDate, ModifiedDate) VALUES
    ('Junior', 'Entry level positions', 1, 1, GETDATE(), GETDATE()),
    ('Intermediate', 'Mid-level positions', 2, 1, GETDATE(), GETDATE()),
    ('Senior', 'Senior level positions', 3, 1, GETDATE(), GETDATE()),
    ('Lead', 'Team lead positions', 4, 1, GETDATE(), GETDATE()),
    ('Manager', 'Management positions', 5, 1, GETDATE(), GETDATE()),
    ('Senior Manager', 'Senior management positions', 6, 1, GETDATE(), GETDATE()),
    ('Director', 'Director level positions', 7, 1, GETDATE(), GETDATE());
    PRINT 'Sample job grades inserted successfully.';
END

-- Insert sample positions if they don't exist
IF NOT EXISTS (SELECT * FROM Positions WHERE PositionID = 1)
BEGIN
    INSERT INTO Positions (PositionTitle, PositionDescription, ExperienceRequirement, JobGroup, JobFunction, DepartmentID, JobGradeID, LeadershipID, IsActive, CreatedDate, ModifiedDate) VALUES
    -- Software Development positions
    ('Junior Software Developer', 'Entry level software development role', 1, 'Engineering', 'Development', 1, 1, 1, 1, GETDATE(), GETDATE()),
    ('Software Developer', 'Mid-level software development role', 3, 'Engineering', 'Development', 1, 2, 1, 1, GETDATE(), GETDATE()),
    ('Senior Software Developer', 'Senior software development role', 5, 'Engineering', 'Development', 1, 3, 1, 1, GETDATE(), GETDATE()),
    ('Software Development Lead', 'Team lead for software development', 7, 'Engineering', 'Development', 1, 4, 2, 1, GETDATE(), GETDATE()),
    ('Software Development Manager', 'Manager for software development team', 8, 'Engineering', 'Development', 1, 5, 3, 1, GETDATE(), GETDATE()),
    
    -- Data Science positions
    ('Junior Data Scientist', 'Entry level data science role', 1, 'Analytics', 'Data Science', 2, 1, 1, 1, GETDATE(), GETDATE()),
    ('Data Scientist', 'Mid-level data science role', 3, 'Analytics', 'Data Science', 2, 2, 1, 1, GETDATE(), GETDATE()),
    ('Senior Data Scientist', 'Senior data science role', 5, 'Analytics', 'Data Science', 2, 3, 1, 1, GETDATE(), GETDATE()),
    ('Data Science Lead', 'Team lead for data science', 7, 'Analytics', 'Data Science', 2, 4, 2, 1, GETDATE(), GETDATE()),
    ('Data Science Manager', 'Manager for data science team', 8, 'Analytics', 'Data Science', 2, 5, 3, 1, GETDATE(), GETDATE()),
    
    -- Product Management positions
    ('Junior Product Manager', 'Entry level product management role', 1, 'Product', 'Product Management', 3, 1, 1, 1, GETDATE(), GETDATE()),
    ('Product Manager', 'Mid-level product management role', 3, 'Product', 'Product Management', 3, 2, 1, 1, GETDATE(), GETDATE()),
    ('Senior Product Manager', 'Senior product management role', 5, 'Product', 'Product Management', 3, 3, 1, 1, GETDATE(), GETDATE()),
    ('Product Lead', 'Team lead for product management', 7, 'Product', 'Product Management', 3, 4, 2, 1, GETDATE(), GETDATE()),
    ('Product Director', 'Director for product management', 8, 'Product', 'Product Management', 3, 6, 4, 1, GETDATE(), GETDATE()),
    
    -- Marketing positions
    ('Marketing Specialist', 'Entry level marketing role', 1, 'Marketing', 'Digital Marketing', 4, 1, 1, 1, GETDATE(), GETDATE()),
    ('Marketing Manager', 'Mid-level marketing management role', 3, 'Marketing', 'Digital Marketing', 4, 2, 1, 1, GETDATE(), GETDATE()),
    ('Senior Marketing Manager', 'Senior marketing management role', 5, 'Marketing', 'Digital Marketing', 4, 3, 1, 1, GETDATE(), GETDATE()),
    ('Marketing Director', 'Director for marketing team', 8, 'Marketing', 'Digital Marketing', 4, 6, 4, 1, GETDATE(), GETDATE()),
    
    -- Sales positions
    ('Sales Representative', 'Entry level sales role', 1, 'Sales', 'Account Management', 5, 1, 1, 1, GETDATE(), GETDATE()),
    ('Senior Sales Representative', 'Senior sales role', 3, 'Sales', 'Account Management', 5, 2, 1, 1, GETDATE(), GETDATE()),
    ('Sales Manager', 'Sales management role', 5, 'Sales', 'Account Management', 5, 3, 1, 1, GETDATE(), GETDATE()),
    ('Sales Director', 'Director for sales team', 8, 'Sales', 'Account Management', 5, 6, 4, 1, GETDATE(), GETDATE());
    PRINT 'Sample positions inserted successfully.';
END

-- Insert sample competency domains if they don't exist
IF NOT EXISTS (SELECT * FROM CompetencyDomains WHERE DomainID = 1)
BEGIN
    INSERT INTO CompetencyDomains (DomainName, DomainDescription, DisplayOrder, IsActive, CreatedDate, ModifiedDate) VALUES
    ('Technical Skills', 'Technical competencies and programming skills', 1, 1, GETDATE(), GETDATE()),
    ('Leadership', 'Leadership and management competencies', 2, 1, GETDATE(), GETDATE()),
    ('Business Acumen', 'Business understanding and strategic thinking', 3, 1, GETDATE(), GETDATE()),
    ('Communication', 'Communication and interpersonal skills', 4, 1, GETDATE(), GETDATE());
    PRINT 'Sample competency domains inserted successfully.';
END

-- Insert sample competency categories if they don't exist
IF NOT EXISTS (SELECT * FROM CompetencyCategories WHERE CategoryID = 1)
BEGIN
    INSERT INTO CompetencyCategories (DomainID, CategoryName, CategoryDescription, DisplayOrder, IsActive, CreatedDate, ModifiedDate) VALUES
    (1, 'Programming Languages', 'Programming language proficiency', 1, 1, GETDATE(), GETDATE()),
    (1, 'Software Architecture', 'System design and architecture skills', 2, 1, GETDATE(), GETDATE()),
    (1, 'Data Analysis', 'Data analysis and visualization skills', 3, 1, GETDATE(), GETDATE()),
    (2, 'Team Leadership', 'Leading and motivating teams', 1, 1, GETDATE(), GETDATE()),
    (2, 'Strategic Thinking', 'Strategic planning and decision making', 2, 1, GETDATE(), GETDATE()),
    (3, 'Market Analysis', 'Understanding market trends and competition', 1, 1, GETDATE(), GETDATE()),
    (3, 'Financial Acumen', 'Understanding financial metrics and budgets', 2, 1, GETDATE(), GETDATE()),
    (4, 'Presentation Skills', 'Effective presentation and public speaking', 1, 1, GETDATE(), GETDATE()),
    (4, 'Negotiation', 'Negotiation and conflict resolution', 2, 1, GETDATE(), GETDATE());
    PRINT 'Sample competency categories inserted successfully.';
END

-- Insert sample competencies if they don't exist
IF NOT EXISTS (SELECT * FROM Competencies WHERE CompetencyID = 1)
BEGIN
    INSERT INTO Competencies (CategoryID, CompetencyName, CompetencyDescription, DisplayOrder, IsActive, CreatedDate, ModifiedDate) VALUES
    -- Technical Skills
    (1, 'JavaScript', 'JavaScript programming proficiency', 1, 1, GETDATE(), GETDATE()),
    (1, 'Python', 'Python programming proficiency', 2, 1, GETDATE(), GETDATE()),
    (1, 'Java', 'Java programming proficiency', 3, 1, GETDATE(), GETDATE()),
    (2, 'System Design', 'Designing scalable software systems', 1, 1, GETDATE(), GETDATE()),
    (2, 'Microservices Architecture', 'Microservices design and implementation', 2, 1, GETDATE(), GETDATE()),
    (3, 'Data Visualization', 'Creating effective data visualizations', 1, 1, GETDATE(), GETDATE()),
    (3, 'Statistical Analysis', 'Statistical analysis and modeling', 2, 1, GETDATE(), GETDATE()),
    
    -- Leadership
    (4, 'Team Building', 'Building and developing high-performing teams', 1, 1, GETDATE(), GETDATE()),
    (4, 'Mentoring', 'Mentoring and coaching team members', 2, 1, GETDATE(), GETDATE()),
    (5, 'Strategic Planning', 'Long-term strategic planning', 1, 1, GETDATE(), GETDATE()),
    (5, 'Decision Making', 'Making informed business decisions', 2, 1, GETDATE(), GETDATE()),
    
    -- Business Acumen
    (6, 'Market Research', 'Conducting market research and analysis', 1, 1, GETDATE(), GETDATE()),
    (6, 'Competitive Analysis', 'Analyzing competitive landscape', 2, 1, GETDATE(), GETDATE()),
    (7, 'Budget Management', 'Managing budgets and financial resources', 1, 1, GETDATE(), GETDATE()),
    (7, 'ROI Analysis', 'Analyzing return on investment', 2, 1, GETDATE(), GETDATE()),
    
    -- Communication
    (8, 'Public Speaking', 'Effective public speaking skills', 1, 1, GETDATE(), GETDATE()),
    (8, 'Written Communication', 'Clear and effective written communication', 2, 1, GETDATE(), GETDATE()),
    (9, 'Client Negotiation', 'Negotiating with clients and stakeholders', 1, 1, GETDATE(), GETDATE()),
    (9, 'Conflict Resolution', 'Resolving conflicts and disputes', 2, 1, GETDATE(), GETDATE());
    PRINT 'Sample competencies inserted successfully.';
END

-- Insert sample position competency requirements
-- This creates a realistic career progression with different competency requirements for different levels
IF NOT EXISTS (SELECT * FROM PositionCompetencyRequirements WHERE RequirementID = 1)
BEGIN
    -- Junior Software Developer requirements
    INSERT INTO PositionCompetencyRequirements (PositionID, CompetencyID, RequiredLevel, IsMandatory, IsActive, CreatedDate, ModifiedDate) VALUES
    (1, 1, 2, 1, 1, GETDATE(), GETDATE()), -- JavaScript Level 2
    (1, 2, 1, 1, 1, GETDATE(), GETDATE()), -- Python Level 1
    (1, 17, 1, 0, 1, GETDATE(), GETDATE()), -- Written Communication Level 1
    
    -- Software Developer requirements
    (2, 1, 3, 1, 1, GETDATE(), GETDATE()), -- JavaScript Level 3
    (2, 2, 2, 1, 1, GETDATE(), GETDATE()), -- Python Level 2
    (2, 4, 2, 1, 1, GETDATE(), GETDATE()), -- System Design Level 2
    (2, 17, 2, 1, 1, GETDATE(), GETDATE()), -- Written Communication Level 2
    
    -- Senior Software Developer requirements
    (3, 1, 4, 1, 1, GETDATE(), GETDATE()), -- JavaScript Level 4
    (3, 2, 3, 1, 1, GETDATE(), GETDATE()), -- Python Level 3
    (3, 4, 3, 1, 1, GETDATE(), GETDATE()), -- System Design Level 3
    (3, 5, 2, 1, 1, GETDATE(), GETDATE()), -- Microservices Architecture Level 2
    (3, 8, 2, 1, 1, GETDATE(), GETDATE()), -- Team Building Level 2
    (3, 17, 3, 1, 1, GETDATE(), GETDATE()), -- Written Communication Level 3
    
    -- Software Development Lead requirements
    (4, 1, 4, 1, 1, GETDATE(), GETDATE()), -- JavaScript Level 4
    (4, 4, 4, 1, 1, GETDATE(), GETDATE()), -- System Design Level 4
    (4, 5, 3, 1, 1, GETDATE(), GETDATE()), -- Microservices Architecture Level 3
    (4, 8, 3, 1, 1, GETDATE(), GETDATE()), -- Team Building Level 3
    (4, 9, 3, 1, 1, GETDATE(), GETDATE()), -- Mentoring Level 3
    (4, 10, 2, 1, 1, GETDATE(), GETDATE()), -- Strategic Planning Level 2
    (4, 17, 3, 1, 1, GETDATE(), GETDATE()), -- Written Communication Level 3
    
    -- Software Development Manager requirements
    (5, 4, 4, 1, 1, GETDATE(), GETDATE()), -- System Design Level 4
    (5, 8, 4, 1, 1, GETDATE(), GETDATE()), -- Team Building Level 4
    (5, 9, 4, 1, 1, GETDATE(), GETDATE()), -- Mentoring Level 4
    (5, 10, 3, 1, 1, GETDATE(), GETDATE()), -- Strategic Planning Level 3
    (5, 11, 3, 1, 1, GETDATE(), GETDATE()), -- Decision Making Level 3
    (5, 15, 2, 1, 1, GETDATE(), GETDATE()), -- Budget Management Level 2
    (5, 17, 4, 1, 1, GETDATE(), GETDATE()), -- Written Communication Level 4
    
    -- Junior Data Scientist requirements
    (6, 2, 2, 1, 1, GETDATE(), GETDATE()), -- Python Level 2
    (6, 6, 2, 1, 1, GETDATE(), GETDATE()), -- Data Visualization Level 2
    (6, 7, 2, 1, 1, GETDATE(), GETDATE()), -- Statistical Analysis Level 2
    
    -- Data Scientist requirements
    (7, 2, 3, 1, 1, GETDATE(), GETDATE()), -- Python Level 3
    (7, 6, 3, 1, 1, GETDATE(), GETDATE()), -- Data Visualization Level 3
    (7, 7, 3, 1, 1, GETDATE(), GETDATE()), -- Statistical Analysis Level 3
    (7, 17, 2, 1, 1, GETDATE(), GETDATE()), -- Written Communication Level 2
    
    -- Senior Data Scientist requirements
    (8, 2, 4, 1, 1, GETDATE(), GETDATE()), -- Python Level 4
    (8, 6, 4, 1, 1, GETDATE(), GETDATE()), -- Data Visualization Level 4
    (8, 7, 4, 1, 1, GETDATE(), GETDATE()), -- Statistical Analysis Level 4
    (8, 8, 2, 1, 1, GETDATE(), GETDATE()), -- Team Building Level 2
    (8, 17, 3, 1, 1, GETDATE(), GETDATE()), -- Written Communication Level 3
    
    -- Data Science Lead requirements
    (9, 2, 4, 1, 1, GETDATE(), GETDATE()), -- Python Level 4
    (9, 7, 4, 1, 1, GETDATE(), GETDATE()), -- Statistical Analysis Level 4
    (9, 8, 3, 1, 1, GETDATE(), GETDATE()), -- Team Building Level 3
    (9, 9, 3, 1, 1, GETDATE(), GETDATE()), -- Mentoring Level 3
    (9, 10, 2, 1, 1, GETDATE(), GETDATE()), -- Strategic Planning Level 2
    (9, 17, 3, 1, 1, GETDATE(), GETDATE()), -- Written Communication Level 3
    
    -- Data Science Manager requirements
    (10, 7, 4, 1, 1, GETDATE(), GETDATE()), -- Statistical Analysis Level 4
    (10, 8, 4, 1, 1, GETDATE(), GETDATE()), -- Team Building Level 4
    (10, 9, 4, 1, 1, GETDATE(), GETDATE()), -- Mentoring Level 4
    (10, 10, 3, 1, 1, GETDATE(), GETDATE()), -- Strategic Planning Level 3
    (10, 11, 3, 1, 1, GETDATE(), GETDATE()), -- Decision Making Level 3
    (10, 15, 2, 1, 1, GETDATE(), GETDATE()), -- Budget Management Level 2
    (10, 17, 4, 1, 1, GETDATE(), GETDATE()); -- Written Communication Level 4
    
    PRINT 'Sample position competency requirements inserted successfully.';
END

-- Insert sample employees for testing
IF NOT EXISTS (SELECT * FROM Employees WHERE EmployeeID = 1)
BEGIN
    INSERT INTO Employees (EmployeeCode, FirstName, LastName, PositionID, DateOfBirth, Gender, Phone, Email, HireDate, IsActive, CreatedDate, ModifiedDate) VALUES
    ('EMP001', 'John', 'Doe', 2, '1990-05-15', 'Male', '+1234567890', 'john.doe@techcorp.com', '2022-01-15', 1, GETDATE(), GETDATE()),
    ('EMP002', 'Jane', 'Smith', 7, '1988-08-22', 'Female', '+1234567891', 'jane.smith@techcorp.com', '2021-06-10', 1, GETDATE(), GETDATE()),
    ('EMP003', 'Mike', 'Johnson', 12, '1985-12-03', 'Male', '+1234567892', 'mike.johnson@techcorp.com', '2020-03-20', 1, GETDATE(), GETDATE());
    PRINT 'Sample employees inserted successfully.';
END

PRINT 'Career Navigator sample data setup completed successfully!';
PRINT '';
PRINT 'Sample data includes:';
PRINT '- 1 Company (TechCorp Solutions)';
PRINT '- 5 Departments (Software Development, Data Science, Product Management, Marketing, Sales)';
PRINT '- 7 Job Grades (Junior to Director)';
PRINT '- 20 Positions across different departments and levels';
PRINT '- 4 Competency Domains (Technical Skills, Leadership, Business Acumen, Communication)';
PRINT '- 9 Competency Categories';
PRINT '- 20 Competencies';
PRINT '- Position competency requirements for realistic career progression';
PRINT '- 3 Sample employees for testing';
PRINT '';
PRINT 'You can now test the Career Navigator feature with this sample data.';
