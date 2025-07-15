using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class CompetencyScore
    {
        [Key]
        public int ScoreID { get; set; }
        
        [Required]
        public int AssessmentID { get; set; }
        
        [Required]
        public int CompetencyID { get; set; }
        
        [Required]
        public int CurrentLevel { get; set; }
        
        [StringLength(1000)]
        public string? Comments { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("AssessmentID")]
        [JsonIgnore]
        public virtual Assessment? Assessment { get; set; }
        
        [ForeignKey("CompetencyID")]
        [JsonIgnore]
        public virtual Competency? Competency { get; set; }
    }
} 