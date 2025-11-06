namespace Career_Management.Server.Models.DTOs
{
    public class CompetencyChangeDto
    {
        public int CompetencyID { get; set; }
        public string CompetencyName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? DomainName { get; set; }
        public string ChangeType { get; set; } = string.Empty; // "added", "removed", "modified"
        public int? OldLevel { get; set; }
        public int? NewLevel { get; set; }
        public bool? OldIsMandatory { get; set; }
        public bool? NewIsMandatory { get; set; }
    }
    
    public class PositionSetChangesDto
    {
        public int PositionID { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public int AssignmentID { get; set; }
        public List<CompetencyChangeDto> Changes { get; set; } = new List<CompetencyChangeDto>();
    }
}

