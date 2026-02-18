namespace CRMF360.Domain.Entities;

public class Role
{
    public int Id { get; set; }              // PK
    public string Name { get; set; } = null!;  // "Admin", "SuperAdmin", "Profesor"

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
