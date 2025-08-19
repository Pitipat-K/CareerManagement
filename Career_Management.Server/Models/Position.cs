using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class Position
    {
        [Key]
        public int PositionID { get; set; }
        
        [Required]
        [StringLength(200)]
        public string PositionTitle { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? PositionDescription { get; set; }
        
        public int? ExperienceRequirement { get; set; }
        
        [StringLength(100)]
        public string? JobGroup { get; set; }
        
        [StringLength(200)]
        public string? JobFunction { get; set; }
        
        public int? JobFamilyID { get; set; }
        
        public int? DepartmentID { get; set; }
        
        public int? JobGradeID { get; set; }
        
        [Required]
        public int LeadershipID { get; set; } = 1;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        
        public int? ModifiedBy { get; set; }
        
        [StringLength(200)]
        public string? Department { get; set; }
        
        [StringLength(200)]
        public string? JobFamily { get; set; }
        
        // Navigation properties
        [ForeignKey("DepartmentID")]
        [JsonIgnore]
        public virtual Department? DepartmentNavigation { get; set; }
        
        [ForeignKey("LeadershipID")]
        [JsonIgnore]
        public virtual LeadershipLevel? LeadershipLevel { get; set; }
        
        [ForeignKey("JobGradeID")]
        [JsonIgnore]
        public virtual JobGrade? JobGrade { get; set; }
        
        [ForeignKey("ModifiedBy")]
        [JsonIgnore]
        public virtual Employee? ModifiedByEmployee { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public virtual ICollection<PositionCompetencyRequirement> CompetencyRequirements { get; set; } = new List<PositionCompetencyRequirement>();
    }
} 