namespace Career_Management.Server.Models.DTOs
{
    public class EmployeeDevelopmentPlanDto
    {
        public int DevelopmentPlanID { get; set; }
        public int EmployeeID { get; set; }
        public int CompetencyID { get; set; }
        public string? CompetencyName { get; set; }
        public string LearningWay { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string TargetDate { get; set; } = string.Empty; // ISO string for frontend
        public string Status { get; set; } = string.Empty;
        public int PlanYear { get; set; }
        public bool IsActive { get; set; }
        public string? EmployeeName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
    }
} 