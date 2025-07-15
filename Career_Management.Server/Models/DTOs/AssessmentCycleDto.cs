namespace Career_Management.Server.Models.DTOs
{
    public class AssessmentCycleDto
    {
        public int CycleID { get; set; }
        public int EmployeeID { get; set; }
        public string? AssessmentPeriod { get; set; }
        public int? SelfAssessmentID { get; set; }
        public int? ManagerAssessmentID { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? SelfCompletedDate { get; set; }
        public DateTime? ManagerCompletedDate { get; set; }
        public bool IsActive { get; set; }
        public string? EmployeeName { get; set; }
        public string? CreatedByName { get; set; }
    }

    public class CreateAssessmentCycleDto
    {
        public int EmployeeID { get; set; }
        public string AssessmentPeriod { get; set; } = string.Empty;
        public int CreatedBy { get; set; }
    }

    public class UpdateAssessmentCycleStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
} 