namespace Career_Management.Server.Models.DTOs
{
    public class CompetencySetWithItemsDto
    {
        public int SetID { get; set; }
        public string SetName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; }
        public int CreatedBy { get; set; }
        public string? CreatedByEmployeeName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public bool IsActive { get; set; }
        public List<CompetencySetItemDto> CompetencySetItems { get; set; } = new List<CompetencySetItemDto>();
    }
}
