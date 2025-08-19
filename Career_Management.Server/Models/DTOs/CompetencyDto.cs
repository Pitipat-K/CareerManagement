namespace Career_Management.Server.Models.DTOs
{
    public class CompetencyDto
    {
        public int CompetencyID { get; set; }
        public int CategoryID { get; set; }
        public string CompetencyName { get; set; } = string.Empty;
        public string? CompetencyDescription { get; set; }
        public int? DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public string? CategoryName { get; set; }
        public string? DomainName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
    }
} 