namespace Career_Management.Server.Models.DTOs
{
    public class UserDto
    {
        public int UserID { get; set; }
        public int EmployeeID { get; set; }
        public string Username { get; set; } = string.Empty;
        public bool IsSystemAdmin { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public int LoginAttempts { get; set; }
        public bool IsLocked { get; set; }
        public DateTime? LockoutEndDate { get; set; }
        public DateTime CreatedDate { get; set; }
        public bool IsActive { get; set; }
        
        // Employee information
        public string EmployeeFullName { get; set; } = string.Empty;
        public string? EmployeeEmail { get; set; }
        public string? DepartmentName { get; set; }
        public string? PositionTitle { get; set; }
        
        // Role information
        public List<UserRoleDto> Roles { get; set; } = new List<UserRoleDto>();
        public int RoleCount { get; set; }
        public string RoleNames { get; set; } = string.Empty;
    }

    public class UserRoleDto
    {
        public int UserRoleID { get; set; }
        public int RoleID { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string RoleCode { get; set; } = string.Empty;
        public DateTime AssignedDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool IsActive { get; set; }
        public string? AssignedByName { get; set; }
    }

    public class CreateUserRequest
    {
        public int EmployeeID { get; set; }
        public string? Username { get; set; }
        public bool IsSystemAdmin { get; set; } = false;
        public string DefaultRoleCode { get; set; } = "EMPLOYEE";
    }

    public class UpdateUserRequest
    {
        public string? Username { get; set; }
        public bool? IsSystemAdmin { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsLocked { get; set; }
    }

    public class AssignRoleRequest
    {
        public int RoleID { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Reason { get; set; }
    }

    public class RemoveRoleRequest
    {
        public int RoleID { get; set; }
        public string? Reason { get; set; }
    }
}
