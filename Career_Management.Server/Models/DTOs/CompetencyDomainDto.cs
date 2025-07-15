namespace Career_Management.Server.Models.DTOs
{
    public class CompetencyDomainDto
    {
        public int DomainID { get; set; }
        public string DomainName { get; set; } = string.Empty;
        public string? DomainDescription { get; set; }
        public int? DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }
} 