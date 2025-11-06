# PositionCompetencySets Table Setup

## Overview
This table tracks the assignment of Positions to Competency Sets, enabling one-time copy of competencies and out-of-sync detection.

## Installation

### Step 1: Run the SQL Script
Execute the following SQL script in your database:
```
Create_PositionCompetencySets_Table.sql
```

### Step 2: Verify Table Creation
After running the script, verify the table was created:
```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'PositionCompetencySets'
```

### Step 3: Verify Indexes
Check that all indexes were created:
```sql
SELECT name, type_desc 
FROM sys.indexes 
WHERE object_id = OBJECT_ID('PositionCompetencySets')
```

You should see:
- Clustered index on AssignmentID (PK)
- Non-clustered indexes on: PositionID, SetID, IsSynced, IsActive
- Unique index on (PositionID, SetID)

## Table Structure

| Column | Type | Description |
|--------|------|-------------|
| AssignmentID | INT | Primary key, auto-increment |
| PositionID | INT | FK to Positions table |
| SetID | INT | FK to CompetencySets table |
| AssignedDate | DATETIME2 | When position was assigned to set |
| AssignedBy | INT | FK to Employees (who assigned) |
| LastSyncedDate | DATETIME2 | Last time competencies were synced |
| SetVersionHash | NVARCHAR(64) | SHA256 hash of set items |
| IsSynced | BIT | TRUE if position is in sync with set |
| IsActive | BIT | Soft delete flag |
| CreatedDate | DATETIME2 | Record creation timestamp |
| ModifiedDate | DATETIME2 | Last modification timestamp |
| ModifiedBy | INT | FK to Employees (who last modified) |

## Key Features

### 1. Version Hash
The `SetVersionHash` column stores a SHA256 hash calculated from:
- All CompetencyIDs in the set
- Their RequiredLevels
- Their IsMandatory flags

This hash is used to detect when a CompetencySet has been modified.

### 2. Sync Detection
When a CompetencySet is updated:
1. New hash is calculated
2. Compared against stored `SetVersionHash`
3. If different, `IsSynced` is set to FALSE
4. User can view changes and apply updates

### 3. Soft Delete
The `IsActive` column allows assignments to be deactivated without deleting:
- Position competency requirements are preserved
- Assignment history is maintained
- Can be reactivated if needed

## Usage Example

### Assign Position to Set
```csharp
var assignment = new PositionCompetencySet
{
    PositionID = 123,
    SetID = 456,
    AssignedBy = currentEmployeeId,
    AssignedDate = DateTime.Now,
    LastSyncedDate = DateTime.Now,
    SetVersionHash = CalculateSetVersionHash(456),
    IsSynced = true,
    IsActive = true
};
```

### Check Sync Status
```sql
SELECT p.PositionTitle, pcs.IsSynced, pcs.LastSyncedDate
FROM PositionCompetencySets pcs
INNER JOIN Positions p ON pcs.PositionID = p.PositionID
WHERE pcs.SetID = 456 AND pcs.IsActive = 1
```

### Find Out-of-Sync Positions
```sql
SELECT p.PositionTitle, cs.SetName, pcs.LastSyncedDate
FROM PositionCompetencySets pcs
INNER JOIN Positions p ON pcs.PositionID = p.PositionID
INNER JOIN CompetencySets cs ON pcs.SetID = cs.SetID
WHERE pcs.IsSynced = 0 AND pcs.IsActive = 1
```

## Constraints

### Foreign Keys
- `PositionID` → Positions(PositionID)
- `SetID` → CompetencySets(SetID)
- `AssignedBy` → Employees(EmployeeID)
- `ModifiedBy` → Employees(EmployeeID)

### Unique Constraint
- `(PositionID, SetID)` - Prevents duplicate assignments

## Rollback
If you need to remove the table:
```sql
DROP TABLE IF EXISTS PositionCompetencySets
```

⚠️ **Warning:** This will permanently delete all position-set assignment data.

## Support
For issues or questions, refer to the main implementation summary:
`POSITION_COMPETENCYSET_IMPLEMENTATION_SUMMARY.md`

