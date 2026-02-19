using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Notifications;

public class NotificationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Message { get; set; }
    public bool IsRead { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public interface INotificationService
{
    Task<List<NotificationDto>> GetByUserAsync(int userId, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(int userId, CancellationToken ct = default);
    Task MarkAsReadAsync(int id, CancellationToken ct = default);
    Task MarkAllAsReadAsync(int userId, CancellationToken ct = default);
    Task<NotificationDto> CreateAsync(int userId, string type, string title, string? message,
        string? relatedEntityType = null, int? relatedEntityId = null, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
