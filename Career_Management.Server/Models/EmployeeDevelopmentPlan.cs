using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class EmployeeDevelopmentPlan
    {
        [Key]
        public int DevelopmentPlanID { get; set; }

        [Required]
        public int EmployeeID { get; set; }

        [Required]
        public int CompetencyID { get; set; }

        [Required]
        [StringLength(50)]
        public string LearningWay { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Priority { get; set; } = string.Empty;

        [Required]
        public DateTime TargetDate { get; set; }

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = string.Empty;

        [Required]
        public int PlanYear { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        [ForeignKey("EmployeeID")]
        public Employee? Employee { get; set; }
        [ForeignKey("CompetencyID")]
        public Competency? Competency { get; set; }
        [ForeignKey("ModifiedBy")]
        [JsonIgnore]
        public virtual Employee? ModifiedByEmployee { get; set; }
    }
} 