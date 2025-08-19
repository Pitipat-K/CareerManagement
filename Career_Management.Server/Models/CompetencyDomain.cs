using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

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
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        public int? ModifiedBy { get; set; }
        
        // Navigation property
        public ICollection<CompetencyCategory> Categories { get; set; } = new List<CompetencyCategory>();
        
        [ForeignKey("ModifiedBy")]
        [JsonIgnore]
        public virtual Employee? ModifiedByEmployee { get; set; }
    }
} 