using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class PermissionType
    {
        [Key]
        public int PermissionTypeID { get; set; }
        
        [Required]
        [StringLength(50)]
        public string PermissionName { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string? PermissionDescription { get; set; }
        
        [Required]
        [StringLength(20)]
        public string PermissionCode { get; set; } = string.Empty;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
        
        public int? ModifiedBy { get; set; }

        // Navigation properties
        [ForeignKey("ModifiedBy")]
        public virtual Employee? ModifiedByEmployee { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
    }
}
