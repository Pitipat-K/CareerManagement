using System.ComponentModel.DataAnnotations;

namespace Career_Management.Server.Models
{
    public class AssessmentCycle
    {
        [Key]
        public int CycleID { get; set; }
        public int EmployeeID { get; set; }
        public string? AssessmentPeriod { get; set; }
        public int? SelfAssessmentID { get; set; }
        public int? ManagerAssessmentID { get; set; }
        public string Status { get; set; } = "Pending";
        public int? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime? SelfCompletedDate { get; set; }
        public DateTime? ManagerCompletedDate { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public Employee? Employee { get; set; }
        public Assessment? SelfAssessment { get; set; }
        public Assessment? ManagerAssessment { get; set; }
        public Employee? CreatedByEmployee { get; set; }
    }
} 