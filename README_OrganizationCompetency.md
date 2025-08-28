# Organization Competency Feature Setup Guide

## Overview
The Organization Competency feature provides a comprehensive view of employee competency achievement across different domains. It includes:
- Employee statistics (Total, White Collar, Blue Collar)
- Competency overview radar chart showing achievement percentages by domain
- Employee distribution by job grade
- Advanced filtering by department, job function, and employee

## Prerequisites
Before using this feature, ensure you have:
1. SQL Server database running
2. Career Management database created
3. Basic tables structure in place

## Database Setup

### Step 1: Run the Core Database Scripts
Execute these scripts in order:

1. **Create_Database_Tables.sql** - Creates the basic table structure
2. **Quick_Setup.sql** - Adds leadership levels and updates positions table
3. **Career_Navigator_Sample_Data.sql** - Creates sample data including:
   - Companies, departments, job functions, job grades
   - Competency domains, categories, and competencies
   - Position competency requirements
   - Sample employees

### Step 2: Add Assessment Data
Execute the assessment data script:

**Add_Sample_Assessments_For_Radar_Chart.sql** - Creates:
- Sample assessments for employees
- Competency scores across different domains
- Varied achievement levels to demonstrate the radar chart

## Feature Components

### 1. Employee Statistics Cards
- **Total Employees**: Shows filtered employee count
- **White Collar**: Employees in professional/managerial roles
- **Blue Collar**: Employees in operational/technical roles

### 2. Competency Overview Radar Chart
- **X-Axis**: Competency domains (Technical Skills, Leadership, Business Acumen, Communication)
- **Y-Axis**: Achievement percentage (0-100%)
- **Data Source**: Calculated from employee competency scores vs. position requirements

### 3. Employee Distribution Chart
- **X-Axis**: Job grades (W1, W2, P1, P2, M1, M2, etc.)
- **Y-Axis**: Number of employees in each grade
- **Features**: Responsive columns with proper scaling for zero values

### 4. Advanced Filters
- **Department**: Multi-select with search functionality
- **Job Function**: Multi-select with search functionality  
- **Employee**: Multi-select with search functionality
- **Real-time filtering**: Updates all charts and statistics instantly

## Data Flow

### Competency Achievement Calculation
1. **Filter Employees**: Based on selected departments, job functions, and employees
2. **Get Position Requirements**: Find competency requirements for each employee's position
3. **Group by Domain**: Organize competencies by their domain
4. **Calculate Achievement**: Compare employee scores vs. required levels
5. **Compute Percentage**: (Achieved Competencies / Total Assigned Competencies) × 100

### Example Calculation
- **Domain**: Technical Skills
- **Total Assigned**: 10 competencies across all filtered employees
- **Total Achieved**: 7 competencies where employees met or exceeded requirements
- **Result**: 70% achievement rate

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch data" Error
**Cause**: Missing API endpoints or database connection issues
**Solution**: 
- Ensure backend is running
- Check database connection
- Verify all required controllers are present

#### 2. "No competency data available" Message
**Cause**: Missing competency data in database
**Solution**:
- Run the sample data scripts
- Check if competency domains, categories, and competencies exist
- Verify position competency requirements are configured

#### 3. White/Blue Collar Counts Show 0
**Cause**: Missing worker category data or incorrect field mapping
**Solution**:
- Check if `WorkerCategory` field exists in Employees table
- Run the worker category setup script
- The system will automatically infer categories from job grades if needed

#### 4. Radar Chart Shows Empty
**Cause**: Missing assessment data or competency scores
**Solution**:
- Ensure assessments exist with 'Completed' status
- Check if competency scores are properly linked to assessments
- Verify position competency requirements are configured

### Debug Information
The component includes console logging for debugging:
- Worker categories found
- Competency data counts
- Employee data samples
- Domain achievement calculations

## API Endpoints Required

### Backend Controllers
1. **CompetencyDomainsController** - GET /api/CompetencyDomains
2. **CompetenciesController** - GET /api/Competencies  
3. **PositionCompetencyRequirementsController** - GET /api/PositionCompetencyRequirements
4. **AssessmentsController** - GET /api/Assessments
5. **CompetencyScoresController** - GET /api/CompetencyScores
6. **EmployeesController** - GET /api/Employees
7. **DepartmentsController** - GET /api/Departments
8. **JobFunctionsController** - GET /api/JobFunctions
9. **PositionsController** - GET /api/Positions/jobgrades

## Performance Considerations

### Data Loading
- All data is fetched on component mount
- Consider implementing pagination for large datasets
- Add caching for frequently accessed data

### Chart Rendering
- Radar chart uses SVG for smooth rendering
- Column chart uses CSS for responsive design
- Consider virtual scrolling for large employee lists

## Customization

### Adding New Competency Domains
1. Insert into `CompetencyDomains` table
2. Add related categories and competencies
3. Create position competency requirements
4. The radar chart will automatically include new domains

### Modifying Achievement Calculation
The calculation logic is in the `calculateCompetencyAchievementByDomain` function:
- Adjust the achievement criteria
- Modify the scoring algorithm
- Add weight factors for different competency types

### Styling Changes
- Modify Tailwind CSS classes for visual updates
- Update chart colors and dimensions
- Adjust card layouts and spacing

## Testing

### Sample Data Validation
1. Verify 4 competency domains exist
2. Check for at least 20 competencies across domains
3. Ensure position competency requirements are configured
4. Validate assessment and score data

### Functionality Testing
1. Test all filter combinations
2. Verify chart responsiveness
3. Check data accuracy across different scenarios
4. Test with empty data sets

## Support

For additional support or feature requests:
1. Check the console for debug information
2. Verify database data integrity
3. Review API endpoint responses
4. Check network tab for failed requests

## Future Enhancements

### Planned Features
- Export functionality for reports
- Historical trend analysis
- Competency gap analysis
- Individual employee competency profiles
- Benchmarking against industry standards

### Technical Improvements
- Real-time data updates
- Advanced filtering options
- Interactive chart tooltips
- Mobile-responsive design improvements
