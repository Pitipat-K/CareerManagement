using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Career_Management.Server.Models
{
    public class CompetencySet
    {
        [Key]
        public int SetID { get; set; }
        
        [Required]
        [StringLength(200)]
        public string SetName { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Description { get; set; }
        
        public bool IsPublic { get; set; } = false;
        
        [Required]
        public int CreatedBy { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("CreatedBy")]
        public virtual Employee? CreatedByEmployee { get; set; }
        
        public virtual ICollection<CompetencySetItem> CompetencySetItems { get; set; } = new List<CompetencySetItem>();
    }
}
