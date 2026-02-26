namespace CRMF360.Domain.Entities;

public enum ProjectStatus
{
    Planned,
    InProgress,
    Paused,
    Done
}

public class Project : ISoftDeletable
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Planned;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDateEstimated { get; set; }
    public decimal? EstimatedHours { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public Company Company { get; set; } = null!;
    public ICollection<BoardColumn> BoardColumns { get; set; } = new List<BoardColumn>();
    public ICollection<Task> Tasks { get; set; } = new List<Task>();
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
}
