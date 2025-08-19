namespace Career_Management.Server.Models.DTOs
{
    public class CompetencyScoreDto
    {
        public int ScoreID { get; set; }
        public int AssessmentID { get; set; }
        public int CompetencyID { get; set; }
        public int CurrentLevel { get; set; }
        public string? Comments { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
        public string? CompetencyName { get; set; }
        public string? CategoryName { get; set; }
        public string? DomainName { get; set; }
    }
}
