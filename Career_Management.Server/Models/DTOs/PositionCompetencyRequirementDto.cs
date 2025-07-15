namespace Career_Management.Server.Models.DTOs
{
    public class PositionCompetencyRequirementDto
    {
        public int RequirementID { get; set; }
        public int PositionID { get; set; }
        public int CompetencyID { get; set; }
        public int RequiredLevel { get; set; }
        public bool IsMandatory { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        
        // Additional properties for display
        public string? PositionTitle { get; set; }
        public string? CompetencyName { get; set; }
        public string? CategoryName { get; set; }
        public string? DomainName { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
    }
} 