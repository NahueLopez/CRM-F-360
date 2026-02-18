namespace CRMF360.Domain.Entities;

public class TimeEntry
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public int UserId { get; set; }
    public DateTime Date { get; set; }
    public decimal Hours { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Task Task { get; set; } = null!;
    public User User { get; set; } = null!;
}
