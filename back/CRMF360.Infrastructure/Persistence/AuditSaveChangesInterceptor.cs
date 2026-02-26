using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace CRMF360.Infrastructure.Persistence;

/// <summary>
/// Intercepts SaveChanges to automatically create AuditLog entries for tracked changes.
/// For Creates: records after save to capture the generated ID.
/// For Updates/Deletes: records before save to capture modified properties.
/// </summary>
public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // AsyncLocal instead of ThreadStatic — safe for async/await continuations
    private static readonly AsyncLocal<List<(object Entity, string EntityType, int UserId, int TenantId)>?> _pendingCreates = new();

    public AuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not ApplicationDbContext context)
            return base.SavingChangesAsync(eventData, result, cancellationToken);

        var userId = GetCurrentUserId();
        if (userId is null) return base.SavingChangesAsync(eventData, result, cancellationToken);

        var tenantId = GetCurrentTenantId();
        _pendingCreates.Value = new();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog) continue;
            if (entry.State is EntityState.Detached or EntityState.Unchanged) continue;

            var entityType = entry.Entity.GetType().Name;

            switch (entry.State)
            {
                case EntityState.Added:
                    // Defer until after save so we have the real ID
                    _pendingCreates.Value.Add((entry.Entity, entityType, userId.Value, tenantId));
                    break;

                case EntityState.Modified:
                {
                    var changes = entry.Properties
                        .Where(p => p.IsModified && p.Metadata.Name is not "UpdatedAt")
                        .Select(p => p.Metadata.Name)
                        .ToList();

                    var action = "Update";
                    if (changes.Contains("IsDeleted"))
                    {
                        var isDeleted = entry.Property("IsDeleted").CurrentValue as bool?;
                        if (isDeleted == true) action = "Delete";
                    }

                    context.AuditLogs.Add(new AuditLog
                    {
                        UserId = userId.Value,
                        TenantId = tenantId,
                        Action = action,
                        EntityType = entityType,
                        EntityId = GetEntityId(entry),
                        Details = changes.Count > 0 ? $"Changed: {string.Join(", ", changes)}" : null,
                        CreatedAt = DateTime.UtcNow,
                    });
                    break;
                }
                case EntityState.Deleted:
                    context.AuditLogs.Add(new AuditLog
                    {
                        UserId = userId.Value,
                        TenantId = tenantId,
                        Action = "Delete",
                        EntityType = entityType,
                        EntityId = GetEntityId(entry),
                        CreatedAt = DateTime.UtcNow,
                    });
                    break;
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is ApplicationDbContext context && _pendingCreates.Value is { Count: > 0 })
        {
            foreach (var (entity, entityType, userId, tenantId) in _pendingCreates.Value)
            {
                var idProp = entity.GetType().GetProperty("Id");
                var entityId = idProp?.GetValue(entity) as int?;

                context.AuditLogs.Add(new AuditLog
                {
                    UserId = userId,
                    TenantId = tenantId,
                    Action = "Create",
                    EntityType = entityType,
                    EntityId = entityId,
                    CreatedAt = DateTime.UtcNow,
                });
            }

            _pendingCreates.Value.Clear();
            await context.SaveChangesAsync(cancellationToken);
        }

        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    private int? GetCurrentUserId()
    {
        var idClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("id")
                   ?? _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        return idClaim is not null && int.TryParse(idClaim.Value, out var id) ? id : null;
    }

    private int GetCurrentTenantId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirstValue("tenantId");
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private static int? GetEntityId(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        var idProp = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "Id");
        return idProp?.CurrentValue as int?;
    }
}
