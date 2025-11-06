using System.ComponentModel.DataAnnotations;

namespace Career_Management.Server.Models.DTOs
{
    public class SyncPositionWithSetRequest
    {
        [Required]
        public List<int> AssignmentIDs { get; set; } = new List<int>();
        
        [Required]
        public int ModifiedBy { get; set; }
    }
}

