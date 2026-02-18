namespace CRMF360.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public bool Active { get; set; } = true;
    public string PasswordHash { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
