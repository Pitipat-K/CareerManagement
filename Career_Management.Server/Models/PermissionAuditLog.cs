using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class PermissionAuditLog
    {
        [Key]
        public int AuditID { get; set; }
        
        [Required]
        public int UserID { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string TargetType { get; set; } = string.Empty;
        
        [Required]
        public int TargetID { get; set; }
        
        [StringLength(500)]
        public string? OldValue { get; set; }
        
        [StringLength(500)]
        public string? NewValue { get; set; }
        
        [StringLength(500)]
        public string? Reason { get; set; }
        
        [StringLength(50)]
        public string? IPAddress { get; set; }
        
        [StringLength(500)]
        public string? UserAgent { get; set; }
        
        public DateTime ActionDate { get; set; } = DateTime.UtcNow;
        
        public int? ActionBy { get; set; }

        // Navigation properties
        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;
        
        [ForeignKey("ActionBy")]
        public virtual Employee? ActionByEmployee { get; set; }
    }
}
