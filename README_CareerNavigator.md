# Career Navigator Feature

## Overview

The Career Navigator is a comprehensive feature that helps employees visualize their career growth opportunities within the organization. It provides an interactive interface for exploring career paths, identifying skill gaps, and understanding progression opportunities.

## Features

### 1. Current Position Display
- Shows the user's current role, department, and level
- Displays key responsibilities and required skills
- Provides a clear overview of the employee's current position

### 2. Career Path Visualization
- **Vertical Growth**: Displays direct promotion opportunities within the same department
- **Lateral Moves**: Shows same-level opportunities within the same department
- **Cross-Department Opportunities**: Highlights roles in other departments that match the user's skills

### 3. Skill Gap Analysis
- Identifies gaps between current competency levels and position requirements
- Prioritizes development areas based on gap severity
- Provides visual indicators for different gap levels (green, yellow, red)

### 4. Interactive Features
- Click on any position to view detailed requirements
- Modal popup with comprehensive position information
- Mobile-responsive design for accessibility

## Technical Implementation

### Frontend Components

#### CareerNavigator.tsx
- Main component for the Career Navigator feature
- Handles data fetching and state management
- Implements responsive design with Tailwind CSS
- Uses Lucide React icons for visual elements

#### Key Features:
- **Data Analysis**: Analyzes career opportunities based on current position
- **Skill Gap Calculation**: Compares employee competencies with position requirements
- **Interactive UI**: Clickable position cards with detailed modals
- **Responsive Design**: Works on desktop and mobile devices

### Backend API Endpoints

#### New Endpoints Added:

1. **GET /api/CompetencyScores/employee/{employeeId}**
   - Returns the latest competency scores for an employee
   - Used for skill gap analysis

2. **GET /api/Positions/career-navigator**
   - Returns all positions with their competency requirements
   - Includes department, job grade, and leadership level information
   - Used for career opportunity analysis

### Database Structure

The feature leverages existing database tables:
- `Positions`: Position information and requirements
- `PositionCompetencyRequirements`: Required competencies for each position
- `CompetencyScores`: Employee competency assessments
- `Employees`: Employee information
- `Departments`: Department information
- `JobGrades`: Job grade levels
- `LeadershipLevels`: Leadership hierarchy

## Installation and Setup

### 1. Database Setup
Run the sample data script to populate the database with test data:

```sql
-- Run the Career Navigator sample data script
-- File: Career_Management.Server/Database_info/Career_Navigator_Sample_Data.sql
```

### 2. Backend Setup
The feature uses existing API endpoints and adds new ones:
- Ensure the backend is running
- Verify the new API endpoints are accessible

### 3. Frontend Setup
The Career Navigator is integrated into the EmployeeDevelopment page:
- Navigate to Employee Development
- Click on "Career Navigator" in the sidebar
- The feature will load automatically

## Usage

### For Employees:
1. **Access the Feature**: Go to Employee Development → Career Navigator
2. **View Current Position**: See your current role and requirements
3. **Explore Opportunities**: Click on different career paths
4. **Identify Skill Gaps**: Review areas for development
5. **Plan Career Growth**: Use the information to plan your career progression

### For Managers:
1. **Support Employee Development**: Help employees understand career paths
2. **Identify Training Needs**: Use skill gap analysis for training planning
3. **Career Planning**: Assist with career development discussions

## Sample Data

The feature includes comprehensive sample data:

### Organizations:
- **TechCorp Solutions**: Sample company with multiple departments

### Departments:
- Software Development
- Data Science
- Product Management
- Marketing
- Sales

### Career Progression Examples:
- **Software Development**: Junior Developer → Developer → Senior Developer → Lead → Manager
- **Data Science**: Junior Data Scientist → Data Scientist → Senior Data Scientist → Lead → Manager
- **Product Management**: Junior Product Manager → Product Manager → Senior Product Manager → Lead → Director

### Competencies:
- **Technical Skills**: JavaScript, Python, Java, System Design, Data Analysis
- **Leadership**: Team Building, Mentoring, Strategic Planning, Decision Making
- **Business Acumen**: Market Research, Budget Management, ROI Analysis
- **Communication**: Public Speaking, Written Communication, Negotiation

## Key Benefits

### For Employees:
- **Clear Career Paths**: Visual representation of career progression
- **Skill Development Focus**: Identifies specific areas for improvement
- **Motivation**: Encourages career planning and development
- **Transparency**: Clear understanding of position requirements

### For Organizations:
- **Talent Retention**: Helps employees see growth opportunities
- **Succession Planning**: Identifies potential internal candidates
- **Skill Development**: Guides training and development programs
- **Employee Engagement**: Increases employee satisfaction and engagement

## Technical Notes

### Performance Considerations:
- API calls are optimized to fetch data efficiently
- Caching is implemented for better performance
- Responsive design ensures good user experience on all devices

### Security:
- Employee data is filtered based on current user
- API endpoints include proper authentication
- Data access is restricted to appropriate users

### Scalability:
- The feature can handle multiple departments and positions
- Database queries are optimized for large datasets
- UI components are reusable and maintainable

## Future Enhancements

Potential improvements for the Career Navigator feature:

1. **Advanced Analytics**: Add predictive career path analysis
2. **Goal Setting**: Allow employees to set career goals
3. **Progress Tracking**: Track progress toward career goals
4. **Mentorship Matching**: Connect employees with potential mentors
5. **Training Recommendations**: Suggest relevant training programs
6. **Success Stories**: Share employee career progression stories
7. **Market Data**: Include industry salary and demand information

## Troubleshooting

### Common Issues:

1. **No Career Opportunities Displayed**
   - Check if sample data is loaded
   - Verify employee has a valid position assigned
   - Ensure competency requirements are set for positions

2. **Skill Gaps Not Showing**
   - Verify employee has completed competency assessments
   - Check if position competency requirements are configured
   - Ensure competency scores are up to date

3. **API Errors**
   - Check backend server is running
   - Verify API endpoints are accessible
   - Check network connectivity

### Debug Information:
- Check browser console for JavaScript errors
- Verify API responses in Network tab
- Review server logs for backend errors

## Support

For technical support or feature requests:
1. Check the existing documentation
2. Review the sample data setup
3. Verify API endpoint accessibility
4. Test with different user roles and positions

The Career Navigator feature provides a comprehensive solution for career development and planning within the organization, helping both employees and managers make informed decisions about career progression.
