using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class Department
    {
        [Key]
        public int DepartmentID { get; set; }
        
        public int? CompanyID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string DepartmentName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public int? ManagerID { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        // Navigation properties
        [ForeignKey("CompanyID")]
        [JsonIgnore]
        public virtual Company? Company { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Position> Positions { get; set; } = new List<Position>();
    }
} 