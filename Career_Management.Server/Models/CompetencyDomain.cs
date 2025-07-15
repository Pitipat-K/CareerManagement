using System.ComponentModel.DataAnnotations;

namespace Career_Management.Server.Models
{
    public class CompetencyDomain
    {
        [Key]
        public int DomainID { get; set; }
        
        [Required]
        [StringLength(200)]
        public string DomainName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? DomainDescription { get; set; }
        
        public int? DisplayOrder { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public ICollection<CompetencyCategory> Categories { get; set; } = new List<CompetencyCategory>();
    }
} 