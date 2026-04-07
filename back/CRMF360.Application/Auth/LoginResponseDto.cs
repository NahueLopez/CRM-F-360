namespace CRMF360.Application.Auth;

public class WorkspaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}

public class LoginResponseDto
{
    public int Id { get; set; }
    public int? TenantId { get; set; }
    public string? TenantName { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string Token { get; set; } = null!;
    public string RefreshToken { get; set; } = null!;
    public List<string> Roles { get; set; } = new();
    public string? Preferences { get; set; }
    public List<string> Permissions { get; set; } = new();
    public List<WorkspaceDto> AvailableWorkspaces { get; set; } = new();
}
