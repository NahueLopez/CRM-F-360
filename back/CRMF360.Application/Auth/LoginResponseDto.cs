namespace CRMF360.Application.Auth;

public class LoginResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string Token { get; set; } = null!;
    public List<string> Roles { get; set; } = new();
}
