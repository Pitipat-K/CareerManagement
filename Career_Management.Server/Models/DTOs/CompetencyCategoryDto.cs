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
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
    }
} 