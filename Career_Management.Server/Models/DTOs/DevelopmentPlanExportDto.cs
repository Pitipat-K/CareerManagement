namespace Career_Management.Server.Models.DTOs
{
    public class DevelopmentPlanExportDto
    {
        public int Year { get; set; }
        public string Department { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Competency { get; set; } = string.Empty;
        public string LearningMethod { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string TargetDate { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}

