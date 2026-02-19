namespace CRMF360.Domain.Entities;

public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }

    /// <summary>Create, Update, Delete, Login, Logout</summary>
    public string Action { get; set; } = null!;

    /// <summary>Project, Task, Company, Contact, Deal, User, etc.</summary>
    public string EntityType { get; set; } = null!;

    public int? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
