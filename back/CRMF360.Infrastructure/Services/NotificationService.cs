using CRMF360.Application.Abstractions;
using CRMF360.Application.Notifications;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace CRMF360.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _db;
    public NotificationService(IApplicationDbContext db) => _db = db;

    public async Task<List<NotificationDto>> GetByUserAsync(int userId, CancellationToken ct = default)
        => await _db.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => Map(n))
            .ToListAsync(ct);

    public async Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default)
        => await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task MarkAsReadAsync(int id, CancellationToken ct = default)
    {
        var n = await _db.Notifications.FindAsync(new object[] { id }, ct);
        if (n is not null) { n.IsRead = true; await _db.SaveChangesAsync(ct); }
    }

    public async Task MarkAllAsReadAsync(int userId, CancellationToken ct = default)
    {
        // Bulk update — single SQL UPDATE, no records loaded into memory
        await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);
    }

    public async Task<NotificationDto> CreateAsync(int userId, string type, string title, string? message,
        string? relatedEntityType = null, int? relatedEntityId = null, CancellationToken ct = default)
    {
        var entity = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            RelatedEntityType = relatedEntityType,
            RelatedEntityId = relatedEntityId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Notifications.Add(entity);
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var n = await _db.Notifications.FindAsync(new object[] { id }, ct);
        if (n is not null) { _db.Notifications.Remove(n); await _db.SaveChangesAsync(ct); }
    }

    private static NotificationDto Map(Notification n) => new()
    {
        Id = n.Id, UserId = n.UserId, Type = n.Type, Title = n.Title,
        Message = n.Message, IsRead = n.IsRead,
        RelatedEntityType = n.RelatedEntityType, RelatedEntityId = n.RelatedEntityId,
        CreatedAt = n.CreatedAt,
    };
}
