namespace CRMF360.Domain.Events;

/// <summary>Dispatches domain events to registered handlers after SaveChanges.</summary>
public interface IDomainEventDispatcher
{
    Task DispatchAsync(IEnumerable<IDomainEvent> events, CancellationToken ct = default);
}

/// <summary>Handles a specific type of domain event.</summary>
public interface IDomainEventHandler<in TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken ct = default);
}
