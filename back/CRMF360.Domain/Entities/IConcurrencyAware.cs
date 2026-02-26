namespace CRMF360.Domain.Entities;

/// <summary>Marker interface for entities that support optimistic concurrency via PostgreSQL xmin.</summary>
public interface IConcurrencyAware
{
    uint RowVersion { get; set; }
}
