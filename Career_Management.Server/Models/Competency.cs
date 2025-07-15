using System.ComponentModel.DataAnnotations;

namespace Career_Management.Server.Models
{
    public class Competency
    {
        [Key]
        public int CompetencyID { get; set; }
        
        public int CategoryID { get; set; }
        
        [Required]
        [StringLength(200)]
        public string CompetencyName { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? CompetencyDescription { get; set; }
        
        public int? DisplayOrder { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public CompetencyCategory? Category { get; set; }
        public ICollection<PositionCompetencyRequirement> PositionRequirements { get; set; } = new List<PositionCompetencyRequirement>();
    }
} 