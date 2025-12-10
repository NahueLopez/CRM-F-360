namespace CRMF360.Application.Users;

public class CreateUserDto
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string Password { get; set; } = null!;
}
