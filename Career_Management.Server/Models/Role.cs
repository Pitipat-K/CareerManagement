using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class Role
    {
        [Key]
        public int RoleID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string RoleName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? RoleDescription { get; set; }
        
        [Required]
        [StringLength(50)]
        public string RoleCode { get; set; } = string.Empty;
        
        public bool IsSystemRole { get; set; } = false;
        
        public int? DepartmentID { get; set; }
        
        public int? CompanyID { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
        
        public int? ModifiedBy { get; set; }

        // Navigation properties
        [ForeignKey("DepartmentID")]
        public virtual Department? Department { get; set; }
        
        [ForeignKey("CompanyID")]
        public virtual Company? Company { get; set; }
        
        [ForeignKey("ModifiedBy")]
        public virtual Employee? ModifiedByEmployee { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
        
        [JsonIgnore]
        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
