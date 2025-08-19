namespace Career_Management.Server.Models.DTOs
{
    public class AssessmentDto
    {
        public int AssessmentID { get; set; }
        public int EmployeeID { get; set; }
        public int? AssessorID { get; set; }
        public DateTime AssessmentDate { get; set; }
        public string? AssessmentPeriod { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? CreatedBy { get; set; }
        public bool IsActive { get; set; }
        public string? EmployeeName { get; set; }
        public string? AssessorName { get; set; }
        public string? CreatedByName { get; set; }
        public string? AssessmentType { get; set; }
    }

    public class CreateAssessmentDto
    {
        public int EmployeeID { get; set; }
        public string AssessmentPeriod { get; set; } = string.Empty;
    }

    public class AssessmentWithCompetenciesDto
    {
        public int AssessmentID { get; set; }
        public int EmployeeID { get; set; }
        public string? AssessmentPeriod { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<CompetencyAssessmentDto> Competencies { get; set; } = new List<CompetencyAssessmentDto>();
    }

    public class CompetencyAssessmentDto
    {
        public int CompetencyID { get; set; }
        public string CompetencyName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string DomainName { get; set; } = string.Empty;
        public int RequiredLevel { get; set; }
        public int? SelfLevel { get; set; }
        public int? ManagerLevel { get; set; }
        public string? Comments { get; set; }
        // Display order properties for sorting
        public int DomainDisplayOrder { get; set; }
        public int CategoryDisplayOrder { get; set; }
        public int CompetencyDisplayOrder { get; set; }
    }

    public class UpdateCompetencyScoreDto
    {
        public int AssessmentID { get; set; }
        public int CompetencyID { get; set; }
        public int CurrentLevel { get; set; }
        public string? Comments { get; set; }
        public int? ModifiedBy { get; set; }
    }

    public class UpdateAssessmentStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
} 