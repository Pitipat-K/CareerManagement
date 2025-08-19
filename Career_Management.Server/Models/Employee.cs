using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class Employee
    {
        [Key]
        public int EmployeeID { get; set; }
        
        [StringLength(20)]
        public string? EmployeeCode { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        public int PositionID { get; set; }
        
        public int? ManagerID { get; set; }
        
        public DateTime? DateOfBirth { get; set; }
        
        [StringLength(20)]
        public string? Gender { get; set; }
        
        [StringLength(20)]
        public string? Phone { get; set; }
        
        [StringLength(100)]
        public string? Email { get; set; }
        
        public DateTime? HireDate { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        
        public int? ModifiedBy { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("PositionID")]
        [JsonIgnore]
        public virtual Position? Position { get; set; }
        
        [ForeignKey("ManagerID")]
        [JsonIgnore]
        public virtual Employee? Manager { get; set; }
        
        [JsonIgnore]
        public virtual ICollection<Employee>? Subordinates { get; set; }
        
        [ForeignKey("ModifiedBy")]
        [JsonIgnore]
        public virtual Employee? ModifiedByEmployee { get; set; }
        
        // Computed property for full name
        [NotMapped]
        public string FullName => $"{FirstName ?? string.Empty} {LastName ?? string.Empty}".Trim();
    }
} 