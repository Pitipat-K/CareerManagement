# Career Management System

A comprehensive career management system for tracking employee competencies, assessments, and development plans.

## Features

- **Employee Management**: Manage employee profiles, positions, and organizational structure
- **Competency Management**: Define and track competencies, categories, and domains
- **Assessment System**: Conduct self and manager assessments with scoring
- **Development Planning**: Create and track employee development plans
- **Position Management**: Manage positions with competency requirements
- **Audit Trail**: Track who created or modified records (ModifiedBy functionality)

## Recent Updates

### ModifiedBy Functionality (Latest)

The system now tracks who creates or modifies positions. When a position is created or modified, the system automatically records the EmployeeID of the current user in the "ModifiedBy" field.

**Key Features:**
- Automatic tracking of who creates or modifies positions
- Display of "Modified By" information in the positions list
- Proper error handling when user is not logged in
- Consistent with existing ModifiedBy patterns in other entities

**Technical Implementation:**
- Added `ModifiedBy` property to `Position` model
- Added `ModifiedByEmployee` navigation property for employee details
- Updated `PositionDto` to include `ModifiedBy` and `ModifiedByEmployeeName`
- Enhanced `PositionsController` to handle ModifiedBy in all CRUD operations
- Updated frontend to pass current employee ID and display ModifiedBy information
- Added database relationship configuration in `CareerManagementContext`

**Database Changes:**
- `Positions` table now includes `ModifiedBy INT` field
- Foreign key relationship to `Employees(EmployeeID)` table
- Existing positions will show "Modified By: -" until updated

## Getting Started

### Prerequisites

- .NET 8.0
- SQL Server
- Node.js (for frontend)

### Installation

1. Clone the repository
2. Set up the database using the scripts in `Career_Management.Server/Database_info/`
3. Update connection strings in `appsettings.json`
4. Run the backend: `dotnet run` in `Career_Management.Server/`
5. Run the frontend: `npm install && npm run dev` in `career_management.client/`

## Database Structure

The system uses a relational database with the following key tables:
- Companies
- Departments  
- Positions (with ModifiedBy tracking)
- Employees
- Competencies
- Assessments
- Development Plans

## API Endpoints

The system provides RESTful APIs for all major entities. Key endpoints include:
- `/api/Positions` - Position management (with ModifiedBy support)
- `/api/Employees` - Employee management
- `/api/Competencies` - Competency management
- `/api/Assessments` - Assessment management

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests. 