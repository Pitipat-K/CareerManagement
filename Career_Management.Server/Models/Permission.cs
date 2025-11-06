using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class Permission
    {
        [Key]
        public int PermissionID { get; set; }
        
        [Required]
        public int ModuleID { get; set; }
        
        [Required]
        public int PermissionTypeID { get; set; }
        
        [StringLength(200)]
        public string? Description { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
        
        public int? ModifiedBy { get; set; }

        // Computed property for full permission name
        [NotMapped]
        public string PermissionFullName => $"{Module?.ModuleCode}_{PermissionType?.PermissionCode}";

        // Navigation properties
        [ForeignKey("ModuleID")]
        public virtual ApplicationModule Module { get; set; } = null!;
        
        [ForeignKey("PermissionTypeID")]
        public virtual PermissionType PermissionType { get; set; } = null!;
        
        [ForeignKey("ModifiedBy")]
        public virtual Employee? ModifiedByEmployee { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
        
        [JsonIgnore]
        public virtual ICollection<UserPermissionOverride> UserPermissionOverrides { get; set; } = new List<UserPermissionOverride>();
    }
}
