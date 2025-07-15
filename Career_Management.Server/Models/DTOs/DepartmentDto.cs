namespace Career_Management.Server.Models.DTOs
{
    public class DepartmentDto
    {
        public int DepartmentID { get; set; }
        public int? CompanyID { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ManagerID { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        
        // Company information
        public string? CompanyName { get; set; }
        
        // Manager information
        public string? ManagerName { get; set; }
    }
} 