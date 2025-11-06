namespace Career_Management.Server.Models.DTOs
{
    public class PositionCompetencySetDto
    {
        public int AssignmentID { get; set; }
        public int PositionID { get; set; }
        public int SetID { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public DateTime AssignedDate { get; set; }
        public DateTime LastSyncedDate { get; set; }
        public bool IsSynced { get; set; }
        public string AssignedByName { get; set; } = string.Empty;
        public int? CompetencyCount { get; set; }
    }
}

