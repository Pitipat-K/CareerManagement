namespace Career_Management.Server.Models.DTOs
{
    public class CompetencySetItemDto
    {
        public int ItemID { get; set; }
        public int SetID { get; set; }
        public int CompetencyID { get; set; }
        public string CompetencyName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? DomainName { get; set; }
        public int RequiredLevel { get; set; }
        public bool IsMandatory { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
