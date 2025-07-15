namespace Career_Management.Server.Models.DTOs
{
    public class CompetencyCategoryDto
    {
        public int CategoryID { get; set; }
        public int DomainID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string? CategoryDescription { get; set; }
        public int? DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public string? DomainName { get; set; }
    }
} 