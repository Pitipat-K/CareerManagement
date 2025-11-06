using System.ComponentModel.DataAnnotations;

namespace Career_Management.Server.Models.DTOs
{
    public class AssignPositionToSetRequest
    {
        [Required]
        public int PositionID { get; set; }
        
        [Required]
        public int AssignedBy { get; set; }
    }
}

