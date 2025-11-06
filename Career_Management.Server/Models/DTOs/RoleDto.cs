namespace Career_Management.Server.Models.DTOs
{
    public class RoleDto
    {
        public int RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? RoleDescription { get; set; }
        public string RoleCode { get; set; } = string.Empty;
        public bool IsSystemRole { get; set; }
        public int? DepartmentID { get; set; }
        public string? DepartmentName { get; set; }
        public int? CompanyID { get; set; }
        public string? CompanyName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }
        public int PermissionCount { get; set; }
        public int UserCount { get; set; }
        public List<PermissionDto> Permissions { get; set; } = new List<PermissionDto>();
    }

    public class CreateRoleRequest
    {
        public string RoleName { get; set; } = string.Empty;
        public string? RoleDescription { get; set; }
        public string RoleCode { get; set; } = string.Empty;
        public int? DepartmentID { get; set; }
        public int? CompanyID { get; set; }
        public List<int> PermissionIDs { get; set; } = new List<int>();
    }

    public class UpdateRoleRequest
    {
        public string? RoleName { get; set; }
        public string? RoleDescription { get; set; }
        public bool? IsActive { get; set; }
        public List<int>? PermissionIDs { get; set; }
    }
}
