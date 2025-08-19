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
        public int? JobGradeID { get; set; }
        public string? JobGradeName { get; set; }
        public int LeadershipID { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
        public string? Department { get; set; }
        public string? JobFamily { get; set; }
        
        // Department information
        public string? DepartmentName { get; set; }
        
        // Leadership information
        public string? LeadershipLevel { get; set; }
    }
} 