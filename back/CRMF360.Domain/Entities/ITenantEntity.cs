namespace CRMF360.Domain.Entities;

/// <summary>Marker interface for entities that belong to a specific tenant.</summary>
public interface ITenantEntity
{
    int TenantId { get; set; }
}
