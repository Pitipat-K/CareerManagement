namespace Career_Management.Server.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(int userId, int employeeId, string email, bool isSystemAdmin);
    }
}

