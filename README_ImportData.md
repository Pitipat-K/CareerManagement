# Import Data Feature

## Overview
The Import Data feature allows users to import employee data from Excel files into the Career Management System.

## Access
- Navigate to the Home page
- Click on the "Import Data" card (orange gradient)
- Or directly access `/import-data` route

## Features

### File Upload
- Supports Excel file formats: `.xlsx`, `.xls`, `.xlsm`
- Drag and drop or click to browse files
- File validation and error handling
- Progress indication during upload

### Required Excel Columns
The Excel file must contain the following columns in the first row:

| Column Name | Required | Description | Format |
|-------------|----------|-------------|---------|
| EmployeeCode | No | Employee identification code | Text |
| FirstName | Yes | Employee's first name | Text |
| LastName | Yes | Employee's last name | Text |
| PositionName | Yes | Position name from the system | Text |
| DateOfBirth | No | Date of birth | YYYY-MM-DD |
| Gender | No | Gender | Text |
| Phone | No | Phone number | Text |
| Email | No | Email address | Text |
| HireDate | No | Hire date | YYYY-MM-DD |

### Validation Rules
- **FirstName** and **LastName** are required fields
- **PositionName** must match exactly with a position in the system
- **DateOfBirth** and **HireDate** must be in YYYY-MM-DD format
- Duplicate **EmployeeCode** entries will be skipped
- Empty rows are automatically skipped

### Available Positions
The page displays all available positions in the system, showing the exact position names to use in your Excel files.

### Template Download
Users can download a CSV template with the correct column headers to use as a starting point for their data.

## Backend API

### Endpoints

#### GET `/api/Employees/positions`
Returns a list of available positions for reference during import.

**Response:**
```json
[
  {
    "positionID": 1,
    "positionTitle": "Software Engineer"
  },
  {
    "positionID": 2,
    "positionTitle": "Project Manager"
  }
]
```

#### POST `/api/Employees/import`
Imports employee data from an uploaded Excel file.

**Request:** Multipart form data with Excel file

**Response:**
```json
{
  "success": true,
  "message": "Import completed. 5 employee(s) imported successfully. 2 employee(s) skipped. 1 error(s) occurred. 1 warning(s) generated.",
  "importedCount": 5,
  "skippedCount": 2,
  "errors": ["Row 3: PositionID 999 does not exist in the system"],
  "warnings": ["Row 4: Invalid DateOfBirth format '2023/01/15', expected YYYY-MM-DD"]
}
```

## Error Handling

### Common Errors
1. **Missing required headers**: FirstName, LastName, or PositionName columns not found
2. **Invalid PositionName**: PositionName doesn't match any position in the system
3. **Invalid date format**: Dates not in YYYY-MM-DD format
4. **Empty file**: No data found in Excel file
5. **Invalid file format**: File is not a valid Excel format

### Warnings
1. **Duplicate EmployeeCode**: Employee with same code already exists
2. **Invalid date format**: Date format issues (non-blocking)
3. **Empty rows**: Rows with no data are skipped

## Technical Implementation

### Frontend
- React TypeScript component with modern UI
- File upload with drag-and-drop support
- Real-time validation and error display
- Progress indicators and loading states
- Responsive design for mobile and desktop

### Backend
- ASP.NET Core Web API
- EPPlus library for Excel processing
- Entity Framework Core for database operations
- Comprehensive error handling and validation
- Transaction support for data integrity

### Database
- Uses existing Employee table structure
- Validates foreign key relationships (PositionID)
- Handles duplicate prevention
- Maintains data integrity constraints

## Usage Example

1. **Prepare Excel File:**
   ```
   EmployeeCode,FirstName,LastName,PositionName,DateOfBirth,Gender,Phone,Email,HireDate
   EMP001,John,Doe,Software Engineer,1990-05-15,Male,555-0123,john.doe@company.com,2023-01-15
   EMP002,Jane,Smith,Project Manager,1985-08-22,Female,555-0124,jane.smith@company.com,2023-02-01
   ```

2. **Upload File:**
   - Navigate to Import Data page
   - Click "Browse Files" or drag Excel file
   - Review file details and click "Import Data"

3. **Review Results:**
   - Check import summary
   - Review any errors or warnings
   - Verify imported data in Employee Management

## Security Considerations
- File type validation prevents malicious uploads
- Input sanitization and validation
- Database transaction rollback on errors
- No sensitive data exposure in error messages 