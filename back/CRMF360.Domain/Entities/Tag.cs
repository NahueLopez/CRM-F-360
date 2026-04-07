namespace CRMF360.Domain.Entities;

public class Tag : ITenantEntity
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = null!;
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CompanyTag> CompanyTags { get; set; } = new List<CompanyTag>();
    public ICollection<ContactTag> ContactTags { get; set; } = new List<ContactTag>();
    public ICollection<DealTag> DealTags { get; set; } = new List<DealTag>();
}

public class CompanyTag
{
    public int CompanyId { get; set; }
    public int TagId { get; set; }
    public Company Company { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}

public class ContactTag
{
    public int ContactId { get; set; }
    public int TagId { get; set; }
    public Contact Contact { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}

public class DealTag
{
    public int DealId { get; set; }
    public int TagId { get; set; }
    public Deal Deal { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
