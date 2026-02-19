using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Reminders;

public class ReminderDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public int? ContactId { get; set; }
    public string? ContactName { get; set; }
    public int? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateReminderDto
{
    public int? ContactId { get; set; }
    public int? CompanyId { get; set; }
    public int? ProjectId { get; set; }
    [Required][MaxLength(200)] public string Title { get; set; } = null!;
    [MaxLength(2000)] public string? Description { get; set; }
    [Required] public DateTime DueDate { get; set; }
}

public interface IReminderService
{
    Task<List<ReminderDto>> GetByUserAsync(int userId, CancellationToken ct = default);
    Task<List<ReminderDto>> GetPendingAsync(int userId, CancellationToken ct = default);
    Task<List<ReminderDto>> GetOverdueAsync(int userId, CancellationToken ct = default);
    Task<ReminderDto> CreateAsync(int userId, CreateReminderDto dto, CancellationToken ct = default);
    Task<bool> ToggleCompleteAsync(int id, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
