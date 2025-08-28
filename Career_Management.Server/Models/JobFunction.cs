using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class JobFunction
    {
        [Key]
        public int JobFunctionID { get; set; }
        
        [Required]
        [StringLength(200)]
        public string JobFunctionName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? JobFunctionDescription { get; set; }
        
        public int? DepartmentID { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        
        public int? ModifiedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("DepartmentID")]
        [JsonIgnore]
        public virtual Department? Department { get; set; }
        
        [ForeignKey("ModifiedBy")]
        [JsonIgnore]
        public virtual Employee? ModifiedByEmployee { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Position> Positions { get; set; } = new List<Position>();
    }
}
