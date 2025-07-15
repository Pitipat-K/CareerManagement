using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class Assessment
    {
        [Key]
        public int AssessmentID { get; set; }
        
        [Required]
        public int EmployeeID { get; set; }
        
        public int? AssessorID { get; set; }
        
        public DateTime AssessmentDate { get; set; } = DateTime.Now;
        
        [StringLength(50)]
        public string? AssessmentPeriod { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = "In Progress";
        
        [StringLength(20)]
        public string AssessmentType { get; set; } = "Self";
        
        public int? RelatedAssessmentID { get; set; }
        
        public int? CreatedBy { get; set; }
        
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("EmployeeID")]
        [JsonIgnore]
        public virtual Employee? Employee { get; set; }
        
        [ForeignKey("AssessorID")]
        [JsonIgnore]
        public virtual Employee? Assessor { get; set; }
        
        [ForeignKey("CreatedBy")]
        [JsonIgnore]
        public virtual Employee? CreatedByEmployee { get; set; }
        
        public virtual ICollection<CompetencyScore> CompetencyScores { get; set; } = new List<CompetencyScore>();
    }
} 