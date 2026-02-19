namespace CRMF360.Domain.Entities;

/// <summary>Marker interface for entities that support soft delete.</summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}
