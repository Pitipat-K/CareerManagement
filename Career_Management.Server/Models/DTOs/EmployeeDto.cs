namespace Career_Management.Server.Models.DTOs
{
    public class EmployeeDto
    {
        public int EmployeeID { get; set; }
        public string? EmployeeCode { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int PositionID { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public DateTime? HireDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsActive { get; set; }
        public string FullName { get; set; } = string.Empty;
        
        // Position information
        public string? PositionTitle { get; set; }
        public string? DepartmentName { get; set; }
    }
} 