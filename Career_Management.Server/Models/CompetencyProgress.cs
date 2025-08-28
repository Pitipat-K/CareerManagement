namespace Career_Management.Server.Models
{
    public class CompetencyProgress
    {
        public int DomainID { get; set; }
        public string Domain { get; set; } = string.Empty;
        public int CategoryID { get; set; }
        public string Category { get; set; } = string.Empty;
        public int CompetencyID { get; set; }
        public string Competency { get; set; } = string.Empty;
        public int Assigned { get; set; }
        public int Achieved { get; set; }
    }
}
