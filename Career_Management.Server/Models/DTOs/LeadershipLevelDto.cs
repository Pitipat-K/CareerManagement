namespace Career_Management.Server.Models.DTOs
{
    public class LeadershipLevelDto
    {
        public int LeadershipID { get; set; }
        public string LevelName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsActive { get; set; }
    }
} 