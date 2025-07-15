namespace Career_Management.Server.Models.DTOs
{
    public class PositionDto
    {
        public int PositionID { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public string? PositionDescription { get; set; }
        public int? ExperienceRequirement { get; set; }
        public string? JobGroup { get; set; }
        public string? JobFunction { get; set; }
        public int? JobFamilyID { get; set; }
        public int? DepartmentID { get; set; }
        public string? JobGrade { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public string? Department { get; set; }
        public string? JobFamily { get; set; }
        
        // Department information
        public string? DepartmentName { get; set; }
    }
} 