using System.ComponentModel.DataAnnotations;

namespace Career_Management.Server.Models
{
    public class PositionCompetencyRequirement
    {
        [Key]
        public int RequirementID { get; set; }
        
        public int PositionID { get; set; }
        
        public int CompetencyID { get; set; }
        
        [Required]
        [Range(0, 4)]
        public int RequiredLevel { get; set; }
        
        public bool IsMandatory { get; set; } = true;
        
        public DateTime? CreatedDate { get; set; } = DateTime.Now;
        
        public DateTime? ModifiedDate { get; set; } = DateTime.Now;
        
        public int? ModifiedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        public Position? Position { get; set; }
        public Competency? Competency { get; set; }
        public Employee? ModifiedByEmployee { get; set; }
    }
} 