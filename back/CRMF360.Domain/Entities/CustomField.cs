namespace CRMF360.Domain.Entities;

public class CustomFieldDefinition : ITenantEntity
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = null!;

    /// <summary>text, number, date, select, boolean</summary>
    public string FieldType { get; set; } = "text";

    /// <summary>Company, Contact, Deal</summary>
    public string EntityType { get; set; } = null!;

    public bool IsRequired { get; set; }

    /// <summary>JSON array of options for "select" type, e.g. ["Option A","Option B"]</summary>
    public string? Options { get; set; }

    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CustomFieldValue> Values { get; set; } = new List<CustomFieldValue>();
}

public class CustomFieldValue : ITenantEntity
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int DefinitionId { get; set; }

    /// <summary>Company, Contact, Deal</summary>
    public string EntityType { get; set; } = null!;

    public int EntityId { get; set; }

    /// <summary>Stored as string; caller converts based on FieldType</summary>
    public string? Value { get; set; }

    public CustomFieldDefinition Definition { get; set; } = null!;
}
