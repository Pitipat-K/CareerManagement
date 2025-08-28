namespace Career_Management.Server.Models.DTOs
{
    public class JobFunctionDto
    {
        public int JobFunctionID { get; set; }
        public string JobFunctionName { get; set; } = string.Empty;
        public string? JobFunctionDescription { get; set; }
        public int? DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int? ModifiedBy { get; set; }
        public string? ModifiedByEmployeeName { get; set; }
        public bool IsActive { get; set; }
    }
}
