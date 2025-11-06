using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Career_Management.Server.Models
{
    public class PasswordResetVerification
    {
        [Key]
        public int VerificationID { get; set; }
        
        [Required]
        public int EmployeeID { get; set; }
        
        [Required]
        [StringLength(10)]
        public string VerificationCode { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public DateTime ExpiryDate { get; set; }
        
        public bool IsUsed { get; set; } = false;
        
        public DateTime? UsedDate { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        [StringLength(50)]
        public string? IPAddress { get; set; }
        
        public bool IsActive { get; set; } = true;

        // Navigation property
        [ForeignKey("EmployeeID")]
        public virtual Employee Employee { get; set; } = null!;
    }
}

