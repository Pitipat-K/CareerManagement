using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }
        
        [Required]
        public int EmployeeID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Username { get; set; } = string.Empty;
        
        public bool IsSystemAdmin { get; set; } = false;
        
        public DateTime? LastLoginDate { get; set; }
        
        public int LoginAttempts { get; set; } = 0;
        
        public bool IsLocked { get; set; } = false;
        
        public DateTime? LockoutEndDate { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime ModifiedDate { get; set; } = DateTime.UtcNow;
        
        public int? ModifiedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Password authentication fields
        [StringLength(256)]
        public string? PasswordHash { get; set; }
        
        [StringLength(256)]
        public string? PasswordSalt { get; set; }
        
        public DateTime? PasswordChangedDate { get; set; }
        
        public bool RequirePasswordChange { get; set; } = false;

        // Navigation properties
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; } = null!;
        
        [ForeignKey("ModifiedBy")]
        public virtual Employee? ModifiedByEmployee { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        
        [JsonIgnore]
        public virtual ICollection<UserPermissionOverride> UserPermissionOverrides { get; set; } = new List<UserPermissionOverride>();
    }
}
