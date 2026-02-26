using CRMF360.Domain.Events;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CRMF360.Infrastructure.Events;

/// <summary>
/// Dispatches domain events by resolving handlers from DI.
/// Events are dispatched AFTER SaveChanges succeeds to ensure consistency.
/// </summary>
public sealed class DomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DomainEventDispatcher> _logger;

    public DomainEventDispatcher(IServiceProvider serviceProvider, ILogger<DomainEventDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAsync(IEnumerable<IDomainEvent> events, CancellationToken ct = default)
    {
        foreach (var domainEvent in events)
        {
            var eventType = domainEvent.GetType();
            var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(eventType);
            var handlers = _serviceProvider.GetServices(handlerType);

            foreach (var handler in handlers)
            {
                try
                {
                    var method = handlerType.GetMethod("HandleAsync")!;
                    var task = (Task)method.Invoke(handler, new object[] { domainEvent, ct })!;
                    await task;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error dispatching domain event {EventType}: {Message}",
                        eventType.Name, ex.Message);
                    // Don't rethrow — event handlers should not break the main flow
                }
            }
        }
    }
}
