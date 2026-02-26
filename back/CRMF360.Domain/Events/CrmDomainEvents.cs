using CRMF360.Domain.Entities;

namespace CRMF360.Domain.Events;

// ── Deal Events ──

public sealed record DealStageChanged(
    int DealId,
    string Title,
    DealStage OldStage,
    DealStage NewStage,
    int TenantId
) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public sealed record DealCreated(
    int DealId,
    string Title,
    decimal? Value,
    int TenantId
) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

public sealed record DealClosed(
    int DealId,
    string Title,
    DealStage FinalStage,
    decimal? Value,
    int TenantId
) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

// ── Contact Events ──

public sealed record ContactCreated(
    int ContactId,
    string FullName,
    int CompanyId,
    int TenantId
) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}

// ── Company Events ──

public sealed record CompanyCreated(
    int CompanyId,
    string Name,
    int TenantId
) : IDomainEvent
{
    public DateTime OccurredAt { get; } = DateTime.UtcNow;
}
