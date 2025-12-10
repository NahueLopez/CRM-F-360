namespace CRMF360.Application.Users;

public class UpdateUserDto
{
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public bool Active { get; set; } = true;
}
