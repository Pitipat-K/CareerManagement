using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class CompetencyCategory
    {
        [Key]
        public int CategoryID { get; set; }
        
        public int DomainID { get; set; }
        
        [Required]
        [StringLength(200)]
        public string CategoryName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? CategoryDescription { get; set; }
        
        public int? DisplayOrder { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        public int? ModifiedBy { get; set; }
        
        // Navigation property
        public CompetencyDomain? Domain { get; set; }
        public ICollection<Competency> Competencies { get; set; } = new List<Competency>();
        
        [ForeignKey("ModifiedBy")]
        [JsonIgnore]
        public virtual Employee? ModifiedByEmployee { get; set; }
    }
} 