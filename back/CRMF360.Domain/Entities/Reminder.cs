namespace CRMF360.Domain.Entities;

public class Reminder : ITenantEntity
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int UserId { get; set; }
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    public int? DealId { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Contact? Contact { get; set; }
    public Company? Company { get; set; }
    public Project? Project { get; set; }
    public Deal? Deal { get; set; }
}
