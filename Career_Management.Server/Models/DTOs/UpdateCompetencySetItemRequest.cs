namespace Career_Management.Server.Models.DTOs
{
    public class UpdateCompetencySetItemRequest
    {
        public int RequiredLevel { get; set; }
        public bool IsMandatory { get; set; }
        public int DisplayOrder { get; set; }
    }
}
