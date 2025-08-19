using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Career_Management.Server.Models
{
    public class JobGrade
    {
        [Key]
        public int JobGradeID { get; set; }

        [Required]
        [StringLength(200)]
        public string JobGradeName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? JobGradeDescription { get; set; }

        public int? JobGradeLevel { get; set; }

        public bool IsActive { get; set; } = true;
    }
} 