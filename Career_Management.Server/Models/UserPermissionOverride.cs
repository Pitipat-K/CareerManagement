using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class UserPermissionOverride
    {
        [Key]
        public int OverrideID { get; set; }
        
        [Required]
        public int UserID { get; set; }
        
        [Required]
        public int PermissionID { get; set; }
        
        [Required]
        public bool IsGranted { get; set; }
        
        [StringLength(500)]
        public string? Reason { get; set; }
        
        public DateTime? ExpiryDate { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        public int? CreatedBy { get; set; }
        
        public bool IsActive { get; set; } = true;

        // Navigation properties
        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;
        
        [ForeignKey("PermissionID")]
        public virtual Permission Permission { get; set; } = null!;
        
        [ForeignKey("CreatedBy")]
        public virtual Employee? CreatedByEmployee { get; set; }
    }
}
