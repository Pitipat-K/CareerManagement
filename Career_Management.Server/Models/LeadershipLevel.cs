using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Career_Management.Server.Models
{
    public class LeadershipLevel
    {
        [Key]
        public int LeadershipID { get; set; }
        
        [Required]
        [StringLength(50)]
        public string LevelName { get; set; } = string.Empty;
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public DateTime ModifiedDate { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [JsonIgnore]
        public virtual ICollection<Position> Positions { get; set; } = new List<Position>();
    }
} 