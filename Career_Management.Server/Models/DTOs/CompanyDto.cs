namespace Career_Management.Server.Models.DTOs
{
    public class CompanyDto
    {
        public int CompanyID { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? DirectorID { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
        
        // Department count
        public int DepartmentCount { get; set; }
        
        // Director information
        public string? DirectorName { get; set; }
    }
} 