using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class ApplicationModule
    {
        [Key]
        public int ModuleID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string ModuleName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? ModuleDescription { get; set; }
        
        [Required]
        [StringLength(50)]
        public string ModuleCode { get; set; } = string.Empty;
        
        public int DisplayOrder { get; set; } = 0;
        
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
