# Leadership Level Implementation

## Overview
This document describes the implementation of the Leadership Level feature in the Career Management System.

## Changes Made

### Backend Changes

#### 1. New Model: LeadershipLevel
- **File**: `Career_Management.Server/Models/LeadershipLevel.cs`
- **Purpose**: Represents leadership levels in the system
- **Properties**:
  - `LeadershipID` (Primary Key)
  - `LevelName` (Required, max 50 characters)
  - `CreatedDate`, `ModifiedDate`, `IsActive`

#### 2. Updated Position Model
- **File**: `Career_Management.Server/Models/Position.cs`
- **Changes**:
  - Added `LeadershipID` property (Required, defaults to 1)
  - Added navigation property to `LeadershipLevel`

#### 3. New DTO: LeadershipLevelDto
- **File**: `Career_Management.Server/Models/DTOs/LeadershipLevelDto.cs`
- **Purpose**: Data transfer object for API responses

#### 4. Updated PositionDto
- **File**: `Career_Management.Server/Models/DTOs/PositionDto.cs`
- **Changes**:
  - Added `LeadershipID` property
  - Added `LeadershipLevel` property for display

#### 5. New Controller: LeadershipLevelsController
- **File**: `Career_Management.Server/Controllers/LeadershipLevelsController.cs`
- **Endpoints**:
  - `GET /api/leadershiplevels` - Get all leadership levels
  - `GET /api/leadershiplevels/{id}` - Get specific leadership level
  - `POST /api/leadershiplevels` - Create new leadership level
  - `PUT /api/leadershiplevels/{id}` - Update leadership level
  - `DELETE /api/leadershiplevels/{id}` - Delete leadership level

#### 6. Updated PositionsController
- **File**: `Career_Management.Server/Controllers/PositionsController.cs`
- **Changes**:
  - Added `LeadershipLevel` include in queries
  - Updated DTO mapping to include leadership level information
  - Updated create/update operations to handle `LeadershipID`

#### 7. Updated Database Context
- **File**: `Career_Management.Server/Data/CareerManagementContext.cs`
- **Changes**:
  - Added `LeadershipLevels` DbSet
  - Added relationship configuration for `LeadershipLevel` to `Position`

### Frontend Changes

#### 1. Updated Positions Component
- **File**: `career_management.client/src/components/Positions.tsx`
- **Changes**:
  - Added `LeadershipLevel` interface
  - Updated `Position` interface to include `leadershipID` and `leadershipLevel`
  - Updated `PositionFormData` interface to include `leadershipID`
  - Added state for `leadershipLevels`
  - Added `fetchLeadershipLevels()` function
  - Added leadership level dropdown in the form
  - Added validation for leadership level field
  - Updated form submission to include `leadershipID`
  - Added leadership level display in both mobile and desktop views

### Database Changes

#### 1. New Table: LeadershipLevel
```sql
CREATE TABLE LeadershipLevel (
    LeadershipID INT IDENTITY(1,1) PRIMARY KEY,
    LevelName NVARCHAR(50) NOT NULL,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
)
```

#### 2. Updated Positions Table
- Added `LeadershipID INT DEFAULT 1 NOT NULL` column
- Added foreign key constraint to `LeadershipLevel(LeadershipID)`

#### 3. Default Data
- **File**: `Career_Management.Server/Database_info/Insert_LeadershipLevels.sql`
- Contains 10 default leadership levels from Individual Contributor to CEO

## API Endpoints

### Leadership Levels
- `GET /api/leadershiplevels` - Get all active leadership levels
- `GET /api/leadershiplevels/{id}` - Get specific leadership level
- `POST /api/leadershiplevels` - Create new leadership level
- `PUT /api/leadershiplevels/{id}` - Update leadership level
- `DELETE /api/leadershiplevels/{id}` - Soft delete leadership level

### Updated Positions Endpoints
- All existing position endpoints now include leadership level information in responses
- Create/Update operations now require `leadershipID` field

## Usage

### Creating a Position
When creating a position, you must now specify a leadership level:

```json
{
  "positionTitle": "Software Engineer",
  "positionDescription": "Develops software applications",
  "leadershipID": 1,
  "departmentID": 1,
  // ... other fields
}
```

### Leadership Level Values
The system comes with 10 default leadership levels:
1. Individual Contributor
2. Team Lead
3. Manager
4. Senior Manager
5. Director
6. Senior Director
7. Vice President
8. Senior Vice President
9. Executive Vice President
10. Chief Executive Officer

## Migration Notes

1. **Database Migration**: Run the `Insert_LeadershipLevels.sql` script to populate default leadership levels
2. **API Updates**: All position-related API calls now include leadership level information
3. **Frontend Updates**: The positions form now requires leadership level selection
4. **Validation**: Leadership level is now a required field when creating or updating positions

## Future Enhancements

1. **Leadership Level Management**: Add a dedicated page for managing leadership levels
2. **Hierarchy Visualization**: Show leadership level hierarchy in organizational charts
3. **Role-based Access**: Implement role-based access control based on leadership levels
4. **Reporting**: Add reports that analyze positions by leadership level 