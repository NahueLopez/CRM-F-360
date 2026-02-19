namespace CRMF360.Domain.Entities;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }

    /// <summary>TaskAssigned, TaskCommented, ProjectAdded, TaskOverdue, ReminderDue, DealStageChanged</summary>
    public string Type { get; set; } = "Info";

    public string Title { get; set; } = null!;
    public string? Message { get; set; }
    public bool IsRead { get; set; }

    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
