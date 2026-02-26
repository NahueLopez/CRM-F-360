namespace CRMF360.Domain.Entities;

public enum DealStage
{
    Lead,
    Contacted,
    Proposal,
    Negotiation,
    ClosedWon,
    ClosedLost
}

public class Deal : ISoftDeletable, ITenantEntity, IConcurrencyAware
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public uint RowVersion { get; set; }
    public string Title { get; set; } = null!;
    public int? CompanyId { get; set; }
    public int? ContactId { get; set; }
    public int? AssignedToId { get; set; }
    public DealStage Stage { get; set; } = DealStage.Lead;
    public decimal? Value { get; set; }
    public string? Currency { get; set; } = "ARS";
    public string? Notes { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    public Company? Company { get; set; }
    public Contact? Contact { get; set; }
    public User? AssignedTo { get; set; }
}
