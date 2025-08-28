using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Career_Management.Server.Models
{
    public class CompetencySetItem
    {
        [Key]
        public int ItemID { get; set; }
        
        [Required]
        public int SetID { get; set; }
        
        [Required]
        public int CompetencyID { get; set; }
        
        [Required]
        [Range(1, 5)]
        public int RequiredLevel { get; set; } = 1;
        
        public bool IsMandatory { get; set; } = true;
        
        public int DisplayOrder { get; set; } = 0;
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        // Navigation properties
        [ForeignKey("SetID")]
        public virtual CompetencySet? CompetencySet { get; set; }
        
        [ForeignKey("CompetencyID")]
        public virtual Competency? Competency { get; set; }
    }
}
