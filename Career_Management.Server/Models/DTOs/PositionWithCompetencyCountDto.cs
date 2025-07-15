namespace Career_Management.Server.Models.DTOs
{
    public class PositionWithCompetencyCountDto
    {
        public int PositionID { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public string? PositionDescription { get; set; }
        public string? DepartmentName { get; set; }
        public bool IsActive { get; set; }
        public int AssignedCompetenciesCount { get; set; }
    }
} 