# Competency Sets Management System

## Overview

The Competency Sets Management System allows users to create, manage, and apply predefined sets of competencies to positions in one click. This feature streamlines the process of assigning multiple competencies to positions and promotes consistency across similar roles.

## Features

### 1. Create Competency Sets
- **Manual Creation**: Create competency sets from scratch with custom names, descriptions, and visibility settings
- **Copy from Position**: Automatically create competency sets by copying competencies from existing positions
- **Public/Private Visibility**: Choose whether your competency sets are visible to all users or just yourself

### 2. Manage Competency Sets
- **View and Edit**: Modify set names, descriptions, and visibility settings
- **Add/Remove Competencies**: Dynamically manage which competencies are included in each set
- **Set Competency Levels**: Define required proficiency levels (1-4) for each competency
- **Mandatory/Optional**: Mark competencies as mandatory or optional requirements

### 3. Apply to Positions
- **One-Click Application**: Apply entire competency sets to positions with a single action
- **Replace Existing**: Automatically replace all existing competency requirements when applying a set
- **Audit Trail**: Track who applied which competency set and when

## Database Structure

### Tables

#### CompetencySets
- `SetID`: Primary key
- `SetName`: Name of the competency set
- `Description`: Optional description
- `IsPublic`: Boolean flag for public/private visibility
- `CreatedBy`: Employee ID who created the set
- `CreatedDate`: Creation timestamp
- `ModifiedDate`: Last modification timestamp
- `IsActive`: Soft delete flag

#### CompetencySetItems
- `ItemID`: Primary key
- `SetID`: Foreign key to CompetencySets
- `CompetencyID`: Foreign key to Competencies
- `RequiredLevel`: Proficiency level required (1-4)
- `IsMandatory`: Boolean flag for mandatory/optional
- `DisplayOrder`: Ordering within the set
- `CreatedDate`: Creation timestamp

## API Endpoints

### Competency Sets Controller

#### GET /api/CompetencySets
- Retrieves all competency sets
- Query parameters: `isPublic` (boolean) to filter by visibility

#### GET /api/CompetencySets/{id}
- Retrieves a specific competency set with all its items

#### POST /api/CompetencySets
- Creates a new competency set

#### PUT /api/CompetencySets/{id}
- Updates an existing competency set

#### DELETE /api/CompetencySets/{id}
- Soft deletes a competency set

#### POST /api/CompetencySets/{id}/items
- Adds a competency to a set

#### DELETE /api/CompetencySets/{id}/items/{itemId}
- Removes a competency from a set

#### POST /api/CompetencySets/copy-from-position
- Creates a new competency set by copying competencies from an existing position

#### POST /api/CompetencySets/{id}/apply-to-position
- Applies a competency set to a position, replacing existing requirements

## Frontend Components

### CompetencySets Component
- **Location**: `src/components/CompetencySets.tsx`
- **Purpose**: Main interface for managing competency sets
- **Features**:
  - List all competency sets with filtering options
  - Create new sets manually
  - Copy sets from existing positions
  - Edit and delete sets
  - View competency details within sets

### Enhanced CompetencyAssign Component
- **Location**: `src/components/CompetencyAssign.tsx`
- **New Features**:
  - "Apply Set" button for each position
  - Modal to select and apply competency sets
  - Integration with existing competency assignment workflow

## Usage Instructions

### 1. Setting Up the Database
```sql
-- Run the SQL script to create tables
-- File: Career_Management.Server/Database_info/Create_CompetencySets_Tables.sql
```

### 2. Accessing Competency Sets
1. Navigate to **Competency Management** → **Competency Sets**
2. Use the interface to create, edit, or manage your competency sets

### 3. Creating Competency Sets

#### Manual Creation
1. Click **"New Set"** button
2. Enter set name and description
3. Choose public/private visibility
4. Click **"Create"**

#### Copy from Position
1. Click **"Copy from Position"** button
2. Select a position with existing competencies
3. Enter set name and description
4. Choose visibility settings
5. Click **"Create Set"**

### 4. Applying Competency Sets to Positions
1. Navigate to **Competency Management** → **Assign**
2. Select a position
3. Click **"Apply Set"** button
4. Choose a competency set from the modal
5. Confirm the action
6. The set will be applied, replacing existing competency requirements

### 5. Managing Competency Sets
- **Edit**: Click the edit icon on any set card
- **Delete**: Click the delete icon (soft delete)
- **View Items**: Click the eye icon to see competencies in the set
- **Filter**: Use search and visibility filters to find specific sets

## Best Practices

### 1. Naming Conventions
- Use descriptive names that clearly indicate the role or function
- Include department or team identifiers when appropriate
- Examples: "Software Development Core", "Sales Team Lead", "HR Generalist"

### 2. Competency Selection
- Include only essential competencies for the role
- Balance mandatory vs. optional requirements
- Consider career progression levels

### 3. Visibility Settings
- **Public**: Use for standard role requirements that should be available to all users
- **Private**: Use for specialized or experimental competency sets

### 4. Regular Maintenance
- Review and update competency sets periodically
- Remove outdated or irrelevant competencies
- Validate that competency levels remain appropriate

## Security and Permissions

- Users can only edit competency sets they created
- Public competency sets are visible to all users
- Private competency sets are only visible to the creator
- All actions are logged with user and timestamp information

## Troubleshooting

### Common Issues

1. **"Position not found" error**
   - Ensure the position exists and is active
   - Check that you have access to the position

2. **"No competencies found" error**
   - Verify that the position has assigned competencies
   - Check that competencies are active

3. **Permission denied errors**
   - Ensure you are logged in
   - Verify that you have the necessary permissions

### Performance Considerations

- Large competency sets may take longer to apply
- Consider breaking very large sets into smaller, focused sets
- Use the filtering options to manage large numbers of sets

## Future Enhancements

- **Templates**: Pre-built competency set templates for common roles
- **Versioning**: Track changes to competency sets over time
- **Bulk Operations**: Apply multiple sets or manage multiple sets simultaneously
- **Analytics**: Track usage patterns and effectiveness of competency sets
- **Approval Workflow**: Require approval before making sets public

## Support

For technical support or questions about the Competency Sets Management System, please refer to the main system documentation or contact your system administrator.
