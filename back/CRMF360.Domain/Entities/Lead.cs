namespace CRMF360.Domain.Entities;

public enum LeadSource
{
    Website, Referral, SocialMedia, Event, ColdCall, Email, Partner, Other
}

public enum LeadStatus
{
    New, Contacted, Qualified, Unqualified, Converted
}

/// <summary>
/// Represents a potential customer before they become a Contact/Deal.
/// Leads can be qualified and converted into a Contact + Deal.
/// </summary>
public class Lead : ISoftDeletable, ITenantEntity
{
    public int Id { get; set; }
    public int TenantId { get; set; }

    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Company { get; set; }
    public string? Position { get; set; }

    public LeadSource Source { get; set; } = LeadSource.Other;
    public LeadStatus Status { get; set; } = LeadStatus.New;

    /// <summary>Estimated deal value if converted</summary>
    public decimal? EstimatedValue { get; set; }

    public string? Notes { get; set; }

    /// <summary>User responsible for this lead</summary>
    public int? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }

    /// <summary>Contact created upon conversion</summary>
    public int? ConvertedContactId { get; set; }
    public Contact? ConvertedContact { get; set; }

    /// <summary>Deal created upon conversion</summary>
    public int? ConvertedDealId { get; set; }
    public Deal? ConvertedDeal { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? ConvertedAt { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
