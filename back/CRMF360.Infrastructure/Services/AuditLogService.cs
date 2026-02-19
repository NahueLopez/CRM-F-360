using CRMF360.Application.Abstractions;
using CRMF360.Application.AuditLogs;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace CRMF360.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IApplicationDbContext _db;
    public AuditLogService(IApplicationDbContext db) => _db = db;

    public async Task<List<AuditLogDto>> GetAllAsync(int page = 1, int pageSize = 50, CancellationToken ct = default)
        => await _db.AuditLogs.AsNoTracking()
            .Include(a => a.User)
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => Map(a))
            .ToListAsync(ct);

    public async Task<List<AuditLogDto>> GetByEntityAsync(string entityType, int entityId, CancellationToken ct = default)
        => await _db.AuditLogs.AsNoTracking()
            .Include(a => a.User)
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(50)
            .Select(a => Map(a))
            .ToListAsync(ct);

    public async Task LogAsync(int userId, string action, string entityType, int? entityId = null,
        string? entityName = null, string? details = null, CancellationToken ct = default)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            EntityName = entityName,
            Details = details,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    private static AuditLogDto Map(AuditLog a) => new()
    {
        Id = a.Id, UserId = a.UserId, UserName = a.User?.FullName ?? "—",
        Action = a.Action, EntityType = a.EntityType, EntityId = a.EntityId,
        EntityName = a.EntityName, Details = a.Details, CreatedAt = a.CreatedAt,
    };
}
