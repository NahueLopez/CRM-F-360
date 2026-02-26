namespace CRMF360.Domain.Entities;

public enum TaskPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public class Task : ISoftDeletable
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int? ColumnId { get; set; }
    public int? AssigneeId { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public int SortOrder { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public Project Project { get; set; } = null!;
    public BoardColumn? Column { get; set; }
    public User? Assignee { get; set; }
    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
}
