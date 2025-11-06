using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Career_Management.Server.Models
{
    public class PositionCompetencySet
    {
        [Key]
        public int AssignmentID { get; set; }
        
        [Required]
        public int PositionID { get; set; }
        
        [Required]
        public int SetID { get; set; }
        
        [Required]
        public DateTime AssignedDate { get; set; } = DateTime.Now;
        
        [Required]
        public int AssignedBy { get; set; }
        
        [Required]
        public DateTime LastSyncedDate { get; set; } = DateTime.Now;
        
        [Required]
        [StringLength(64)]
        public string SetVersionHash { get; set; } = string.Empty;
        
        [Required]
        public bool IsSynced { get; set; } = true;
        
        [Required]
        public bool IsActive { get; set; } = true;
        
        [Required]
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        [Required]
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        
        public int? ModifiedBy { get; set; }
        
        // Navigation properties
        [ForeignKey("PositionID")]
        public virtual Position? Position { get; set; }
        
        [ForeignKey("SetID")]
        public virtual CompetencySet? CompetencySet { get; set; }
        
        [ForeignKey("AssignedBy")]
        public virtual Employee? AssignedByEmployee { get; set; }
        
        [ForeignKey("ModifiedBy")]
        public virtual Employee? ModifiedByEmployee { get; set; }
    }
}

