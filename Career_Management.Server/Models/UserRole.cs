using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class UserRole
    {
        [Key]
        public int UserRoleID { get; set; }
        
        [Required]
        public int UserID { get; set; }
        
        [Required]
        public int RoleID { get; set; }
        
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime? ExpiryDate { get; set; }
        
        public int? AssignedBy { get; set; }
        
        public bool IsActive { get; set; } = true;

        // Navigation properties
        [ForeignKey("UserID")]
        public virtual User User { get; set; } = null!;
        
        [ForeignKey("RoleID")]
        public virtual Role Role { get; set; } = null!;
        
        [ForeignKey("AssignedBy")]
        public virtual Employee? AssignedByEmployee { get; set; }
    }
}
