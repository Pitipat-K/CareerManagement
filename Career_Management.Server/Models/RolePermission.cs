using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class RolePermission
    {
        [Key]
        public int RolePermissionID { get; set; }
        
        [Required]
        public int RoleID { get; set; }
        
        [Required]
        public int PermissionID { get; set; }
        
        public DateTime GrantedDate { get; set; } = DateTime.UtcNow;
        
        public int? GrantedBy { get; set; }
        
        public bool IsActive { get; set; } = true;

        // Navigation properties
        [ForeignKey("RoleID")]
        public virtual Role Role { get; set; } = null!;
        
        [ForeignKey("PermissionID")]
        public virtual Permission Permission { get; set; } = null!;
        
        [ForeignKey("GrantedBy")]
        public virtual Employee? GrantedByEmployee { get; set; }
    }
}
