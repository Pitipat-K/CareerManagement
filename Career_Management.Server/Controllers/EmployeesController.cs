using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Career_Management.Server.Data;
using Career_Management.Server.Models;
using Career_Management.Server.Models.DTOs;
using OfficeOpenXml;
using System.Data;

namespace Career_Management.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly CareerManagementContext _context;

        public EmployeesController(CareerManagementContext context)
        {
            _context = context;
        }

        // GET: api/Employees
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees()
        {
            var employees = await _context.Employees
                .Where(e => e.IsActive)
                .Include(e => e.Position)
                .ThenInclude(p => p.DepartmentNavigation)
                .Include(e => e.Manager)
                .Include(e => e.ModifiedByEmployee) // Added
                .ToListAsync();

            var employeeDtos = employees.Select(e => new EmployeeDto
            {
                EmployeeID = e.EmployeeID,
                EmployeeCode = e.EmployeeCode,
                FirstName = e.FirstName,
                LastName = e.LastName,
                PositionID = e.PositionID,
                ManagerID = e.ManagerID,
                DateOfBirth = e.DateOfBirth,
                Gender = e.Gender,
                Phone = e.Phone,
                Email = e.Email,
                HireDate = e.HireDate,
                CreatedDate = e.CreatedDate,
                ModifiedDate = e.ModifiedDate,
                ModifiedBy = e.ModifiedBy, // Added
                ModifiedByEmployeeName = e.ModifiedByEmployee?.FullName, // Added
                IsActive = e.IsActive,
                FullName = e.FullName,
                PositionTitle = e.Position?.PositionTitle ?? string.Empty,
                DepartmentName = e.Position?.DepartmentNavigation?.DepartmentName,
                ManagerName = e.Manager?.FullName
            }).ToList();

            return employeeDtos;
        }

        // GET: api/Employees/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDto>> GetEmployee(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.Position)
                .ThenInclude(p => p.DepartmentNavigation)
                .Include(e => e.Manager)
                .Include(e => e.ModifiedByEmployee) // Added
                .FirstOrDefaultAsync(e => e.EmployeeID == id && e.IsActive);

            if (employee == null)
            {
                return NotFound();
            }

            var employeeDto = new EmployeeDto
            {
                EmployeeID = employee.EmployeeID,
                EmployeeCode = employee.EmployeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                PositionID = employee.PositionID,
                ManagerID = employee.ManagerID,
                DateOfBirth = employee.DateOfBirth,
                Gender = employee.Gender,
                Phone = employee.Phone,
                Email = employee.Email,
                HireDate = employee.HireDate,
                CreatedDate = employee.CreatedDate,
                ModifiedDate = employee.ModifiedDate,
                ModifiedBy = employee.ModifiedBy, // Added
                ModifiedByEmployeeName = employee.ModifiedByEmployee?.FullName, // Added
                IsActive = employee.IsActive,
                FullName = employee.FullName,
                PositionTitle = employee.Position?.PositionTitle ?? string.Empty,
                DepartmentName = employee.Position?.DepartmentNavigation?.DepartmentName,
                ManagerName = employee.Manager?.FullName
            };

            return employeeDto;
        }

        // POST: api/Employees
        [HttpPost]
        public async Task<ActionResult<Employee>> CreateEmployee(Employee employee)
        {
            employee.CreatedDate = DateTime.Now;
            employee.ModifiedDate = DateTime.Now;
            employee.ModifiedBy = employee.ModifiedBy; // Added
            employee.IsActive = true;
            
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEmployee), new { id = employee.EmployeeID }, employee);
        }

        // PUT: api/Employees/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, Employee employee)
        {
            if (id != employee.EmployeeID)
            {
                return BadRequest();
            }

            var existingEmployee = await _context.Employees.FindAsync(id);
            if (existingEmployee == null || !existingEmployee.IsActive)
            {
                return NotFound();
            }

            existingEmployee.EmployeeCode = employee.EmployeeCode;
            existingEmployee.FirstName = employee.FirstName;
            existingEmployee.LastName = employee.LastName;
            existingEmployee.PositionID = employee.PositionID;
            existingEmployee.ManagerID = employee.ManagerID;
            existingEmployee.DateOfBirth = employee.DateOfBirth;
            existingEmployee.Gender = employee.Gender;
            existingEmployee.Phone = employee.Phone;
            existingEmployee.Email = employee.Email;
            existingEmployee.HireDate = employee.HireDate;
            existingEmployee.ModifiedDate = DateTime.Now;
            existingEmployee.ModifiedBy = employee.ModifiedBy; // Added

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmployeeExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Employees/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id, [FromQuery] int? modifiedBy)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null || !employee.IsActive)
            {
                return NotFound();
            }

            employee.IsActive = false;
            employee.ModifiedBy = modifiedBy; // Added
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool EmployeeExists(int id)
        {
            return _context.Employees.Any(e => e.EmployeeID == id && e.IsActive);
        }

        // GET: api/Employees/positions
        [HttpGet("positions")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailablePositions()
        {
            var positions = await _context.Positions
                .Where(p => p.IsActive)
                .Select(p => new { p.PositionID, p.PositionTitle })
                .OrderBy(p => p.PositionTitle)
                .ToListAsync();

            return Ok(positions);
        }

        // GET: api/Employees/managers
        [HttpGet("managers")]
        public async Task<ActionResult<IEnumerable<object>>> GetAvailableManagers()
        {
            var managers = await _context.Employees
                .Where(e => e.IsActive)
                .Select(e => new { e.EmployeeID, e.FirstName, e.LastName })
                .OrderBy(e => e.FirstName)
                .ThenBy(e => e.LastName)
                .ToListAsync();

            var result = managers.Select(m => new { m.EmployeeID, FullName = $"{m.FirstName} {m.LastName}" });

            return Ok(result);
        }

        // POST: api/Employees/import
        [HttpPost("import")]
        public async Task<ActionResult<ImportResultDto>> ImportEmployees(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ImportResultDto
                {
                    Success = false,
                    Message = "No file was uploaded."
                });
            }

            // Check file extension
            var allowedExtensions = new[] { ".xlsx", ".xls", ".xlsm" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new ImportResultDto
                {
                    Success = false,
                    Message = "Invalid file format. Please upload an Excel file (.xlsx, .xls, .xlsm)."
                });
            }

            var result = new ImportResultDto();
            var importedCount = 0;
            var skippedCount = 0;
            var errors = new List<string>();
            var warnings = new List<string>();

            try
            {
                // Set EPPlus license context
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var stream = file.OpenReadStream();
                using var package = new ExcelPackage(stream);
                var worksheet = package.Workbook.Worksheets.FirstOrDefault();

                if (worksheet == null)
                {
                    return BadRequest(new ImportResultDto
                    {
                        Success = false,
                        Message = "No worksheet found in the Excel file."
                    });
                }

                // Get the used range
                var usedRange = worksheet.Cells;
                var rowCount = usedRange.Rows;
                var colCount = usedRange.Columns;

                // Validate that we have data
                if (rowCount == 0 || colCount == 0)
                {
                    return BadRequest(new ImportResultDto
                    {
                        Success = false,
                        Message = "The Excel file appears to be empty."
                    });
                }

                if (rowCount < 2) // At least header + 1 data row
                {
                    return BadRequest(new ImportResultDto
                    {
                        Success = false,
                        Message = "The Excel file must contain at least a header row and one data row."
                    });
                }

                // Read headers from first row
                var headers = new List<string>();
                for (int col = 1; col <= colCount; col++)
                {
                    var headerValue = worksheet.Cells[1, col].Value?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(headerValue))
                    {
                        headers.Add(headerValue);
                    }
                }

                if (headers.Count == 0)
                {
                    return BadRequest(new ImportResultDto
                    {
                        Success = false,
                        Message = "No valid headers found in the first row of the Excel file."
                    });
                }

                // Validate required headers
                var requiredHeaders = new[] { "FirstName", "LastName", "PositionName" };
                var missingHeaders = requiredHeaders.Where(h => !headers.Contains(h)).ToList();
                if (missingHeaders.Any())
                {
                    return BadRequest(new ImportResultDto
                    {
                        Success = false,
                        Message = $"Missing required headers: {string.Join(", ", missingHeaders)}"
                    });
                }

                // Process data rows
                for (int row = 2; row <= rowCount; row++)
                {
                    try
                    {
                        var employee = new Employee();
                        var hasData = false;

                        // Check if row has any data
                        for (int col = 1; col <= headers.Count; col++)
                        {
                            var cellValue = worksheet.Cells[row, col].Value?.ToString()?.Trim();
                            if (!string.IsNullOrEmpty(cellValue))
                            {
                                hasData = true;
                                break;
                            }
                        }

                        if (!hasData) continue; // Skip empty rows

                        // Map Excel columns to employee properties
                        for (int col = 1; col <= headers.Count; col++)
                        {
                            var header = headers[col - 1];
                            var cellValue = worksheet.Cells[row, col].Value?.ToString()?.Trim();

                            switch (header.ToLower())
                            {
                                case "employeecode":
                                    employee.EmployeeCode = cellValue;
                                    break;
                                case "firstname":
                                    if (string.IsNullOrEmpty(cellValue))
                                    {
                                        errors.Add($"Row {row}: FirstName is required");
                                        continue;
                                    }
                                    employee.FirstName = cellValue;
                                    break;
                                case "lastname":
                                    if (string.IsNullOrEmpty(cellValue))
                                    {
                                        errors.Add($"Row {row}: LastName is required");
                                        continue;
                                    }
                                    employee.LastName = cellValue;
                                    break;
                                case "positionname":
                                    if (string.IsNullOrEmpty(cellValue))
                                    {
                                        errors.Add($"Row {row}: PositionName is required");
                                        continue;
                                    }
                                    // We'll resolve the PositionID later
                                    break;
                                case "managerid":
                                    if (!string.IsNullOrEmpty(cellValue))
                                    {
                                        if (int.TryParse(cellValue, out int managerId))
                                        {
                                            employee.ManagerID = managerId;
                                        }
                                        else
                                        {
                                            warnings.Add($"Row {row}: Invalid ManagerID format '{cellValue}', expected numeric value");
                                        }
                                    }
                                    break;
                                case "dateofbirth":
                                    if (!string.IsNullOrEmpty(cellValue))
                                    {
                                        if (DateTime.TryParse(cellValue, out DateTime dob))
                                        {
                                            employee.DateOfBirth = dob;
                                        }
                                        else
                                        {
                                            warnings.Add($"Row {row}: Invalid DateOfBirth format '{cellValue}', expected YYYY-MM-DD");
                                        }
                                    }
                                    break;
                                case "gender":
                                    employee.Gender = cellValue;
                                    break;
                                case "phone":
                                    employee.Phone = cellValue;
                                    break;
                                case "email":
                                    employee.Email = cellValue;
                                    break;
                                case "hiredate":
                                    if (!string.IsNullOrEmpty(cellValue))
                                    {
                                        if (DateTime.TryParse(cellValue, out DateTime hireDate))
                                        {
                                            employee.HireDate = hireDate;
                                        }
                                        else
                                        {
                                            warnings.Add($"Row {row}: Invalid HireDate format '{cellValue}', expected YYYY-MM-DD");
                                        }
                                    }
                                    break;
                            }
                        }

                        // Validate employee data
                        if (string.IsNullOrEmpty(employee.FirstName) || string.IsNullOrEmpty(employee.LastName))
                        {
                            errors.Add($"Row {row}: FirstName and LastName are required");
                            continue;
                        }

                        // Resolve PositionName to PositionID
                        string positionName = null;
                        for (int col = 1; col <= headers.Count; col++)
                        {
                            var header = headers[col - 1];
                            if (header.ToLower() == "positionname")
                            {
                                positionName = worksheet.Cells[row, col].Value?.ToString()?.Trim();
                                break;
                            }
                        }

                        if (string.IsNullOrEmpty(positionName))
                        {
                            errors.Add($"Row {row}: PositionName is required");
                            continue;
                        }

                        // Find position by name
                        var position = await _context.Positions
                            .FirstOrDefaultAsync(p => p.PositionTitle.ToLower() == positionName.ToLower() && p.IsActive);
                        
                        if (position == null)
                        {
                            errors.Add($"Row {row}: Position '{positionName}' does not exist in the system");
                            continue;
                        }

                        employee.PositionID = position.PositionID;

                        // Validate ManagerID if provided
                        if (employee.ManagerID.HasValue)
                        {
                            var managerExists = await _context.Employees
                                .AnyAsync(e => e.EmployeeID == employee.ManagerID.Value && e.IsActive);
                            if (!managerExists)
                            {
                                warnings.Add($"Row {row}: ManagerID {employee.ManagerID.Value} does not exist, setting to null");
                                employee.ManagerID = null;
                            }
                        }

                        // Check for duplicate EmployeeCode
                        if (!string.IsNullOrEmpty(employee.EmployeeCode))
                        {
                            var existingEmployee = await _context.Employees
                                .FirstOrDefaultAsync(e => e.EmployeeCode == employee.EmployeeCode && e.IsActive);
                            if (existingEmployee != null)
                            {
                                warnings.Add($"Row {row}: EmployeeCode '{employee.EmployeeCode}' already exists, skipping");
                                skippedCount++;
                                continue;
                            }
                        }

                        // Set default values
                        employee.CreatedDate = DateTime.Now;
                        employee.ModifiedDate = DateTime.Now;
                        employee.IsActive = true;

                        // Add employee to context
                        _context.Employees.Add(employee);
                        importedCount++;
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Row {row}: Error processing row - {ex.Message}");
                    }
                }

                // Save changes to database
                if (importedCount > 0)
                {
                    await _context.SaveChangesAsync();
                }

                result.Success = true;
                result.ImportedCount = importedCount;
                result.SkippedCount = skippedCount;
                result.Errors = errors;
                result.Warnings = warnings;

                var message = $"Import completed. {importedCount} employee(s) imported successfully.";
                if (skippedCount > 0)
                {
                    message += $" {skippedCount} employee(s) skipped.";
                }
                if (errors.Count > 0)
                {
                    message += $" {errors.Count} error(s) occurred.";
                }
                if (warnings.Count > 0)
                {
                    message += $" {warnings.Count} warning(s) generated.";
                }

                result.Message = message;

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ImportResultDto
                {
                    Success = false,
                    Message = $"An error occurred during import: {ex.Message}"
                });
            }
        }
    }
} 