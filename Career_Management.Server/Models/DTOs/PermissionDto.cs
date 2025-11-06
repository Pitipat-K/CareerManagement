namespace Career_Management.Server.Models.DTOs
{
    public class PermissionDto
    {
        public int PermissionID { get; set; }
        public int ModuleID { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public string ModuleCode { get; set; } = string.Empty;
        public int PermissionTypeID { get; set; }
        public string PermissionName { get; set; } = string.Empty;
        public string PermissionCode { get; set; } = string.Empty;
        public string PermissionFullName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }

    public class UserPermissionDto
    {
        public int UserID { get; set; }
        public string UserFullName { get; set; } = string.Empty;
        public string ModuleName { get; set; } = string.Empty;
        public string ModuleCode { get; set; } = string.Empty;
        public string PermissionName { get; set; } = string.Empty;
        public string PermissionCode { get; set; } = string.Empty;
        public string PermissionFullName { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public string PermissionSource { get; set; } = string.Empty; // "Role" or "Override"
        public bool IsGranted { get; set; }
        public DateTime EffectiveDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }

    public class PermissionCheckRequest
    {
        public int UserID { get; set; }
        public string ModuleCode { get; set; } = string.Empty;
        public string PermissionCode { get; set; } = string.Empty;
    }

    public class PermissionCheckResponse
    {
        public bool HasPermission { get; set; }
        public string Reason { get; set; } = string.Empty;
        public List<string> Sources { get; set; } = new List<string>();
    }

    public class PermissionOverrideRequest
    {
        public int UserID { get; set; }
        public int PermissionID { get; set; }
        public bool IsGranted { get; set; }
        public string? Reason { get; set; }
        public DateTime? ExpiryDate { get; set; }
    }
}
