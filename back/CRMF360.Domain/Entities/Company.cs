namespace CRMF360.Domain.Entities;

public class Company : ISoftDeletable
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Cuit { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<ActivityLog> Activities { get; set; } = new List<ActivityLog>();
}
