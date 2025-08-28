using System.ComponentModel.DataAnnotations;

namespace Career_Management.Server.Models.DTOs
{
    public class UpdateCompetencySetRequest
    {
        [Required]
        [StringLength(200)]
        public string SetName { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Description { get; set; }
        
        public bool IsPublic { get; set; } = false;
    }
}
