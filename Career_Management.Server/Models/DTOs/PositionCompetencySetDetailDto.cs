namespace Career_Management.Server.Models.DTOs
{
    public class PositionCompetencySetDetailDto
    {
        public int AssignmentID { get; set; }
        public int PositionID { get; set; }
        public string PositionTitle { get; set; } = string.Empty;
        public string? PositionDescription { get; set; }
        public string? DepartmentName { get; set; }
        public int SetID { get; set; }
        public string SetName { get; set; } = string.Empty;
        public string? SetDescription { get; set; }
        public DateTime AssignedDate { get; set; }
        public DateTime LastSyncedDate { get; set; }
        public bool IsSynced { get; set; }
        public string AssignedByName { get; set; } = string.Empty;
        public int CompetencyCount { get; set; }
        public int SyncedCompetencyCount { get; set; }
    }
}

