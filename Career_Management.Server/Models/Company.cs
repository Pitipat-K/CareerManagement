using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class Company
    {
        [Key]
        public int CompanyID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string CompanyName { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public int? DirectorID { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<Department> Departments { get; set; } = new List<Department>();
    }
} 