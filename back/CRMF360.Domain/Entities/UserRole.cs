namespace CRMF360.Domain.Entities;

public class UserRole : ITenantEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
    
    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
}
