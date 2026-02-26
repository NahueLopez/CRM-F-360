namespace CRMF360.Domain.Entities;

public class Contact : ISoftDeletable, IConcurrencyAware
{
    public int Id { get; set; }
    public uint RowVersion { get; set; }
    public int CompanyId { get; set; }
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Position { get; set; }
    public string? Notes { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public Company Company { get; set; } = null!;
    public ICollection<ActivityLog> Activities { get; set; } = new List<ActivityLog>();
}
