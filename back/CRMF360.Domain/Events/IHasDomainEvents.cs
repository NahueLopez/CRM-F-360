namespace CRMF360.Domain.Events;

/// <summary>Interface for entities that raise domain events.</summary>
public interface IHasDomainEvents
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    void ClearDomainEvents();
}
