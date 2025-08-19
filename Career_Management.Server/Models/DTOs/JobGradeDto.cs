namespace Career_Management.Server.Models.DTOs
{
    public class JobGradeDto
    {
        public int JobGradeID { get; set; }
        public string JobGradeName { get; set; } = string.Empty;
        public string? JobGradeDescription { get; set; }
        public int? JobGradeLevel { get; set; }
        public bool IsActive { get; set; }
    }
} 