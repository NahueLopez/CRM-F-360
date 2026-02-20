using CRMF360.Application.Abstractions;
using CRMF360.Application.Notifications;
using CRMF360.Application.TaskComments;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class TaskCommentService : ITaskCommentService
{
    private readonly IApplicationDbContext _db;
    private readonly INotificationService _notif;

    public TaskCommentService(IApplicationDbContext db, INotificationService notif)
    {
        _db = db;
        _notif = notif;
    }

    public async Task<List<TaskCommentDto>> GetByTaskAsync(int taskId, CancellationToken ct = default)
        => await _db.TaskComments.AsNoTracking()
            .Include(tc => tc.User)
            .Where(tc => tc.TaskId == taskId)
            .OrderBy(tc => tc.CreatedAt)
            .Select(tc => Map(tc))
            .ToListAsync(ct);

    public async Task<TaskCommentDto> CreateAsync(CreateTaskCommentDto dto, CancellationToken ct = default)
    {
        var entity = new TaskComment
        {
            TaskId = dto.TaskId,
            UserId = dto.UserId,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow,
        };
        _db.TaskComments.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Notify the task assignee (if different from the commenter)
        var task = await _db.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == dto.TaskId, ct);

        if (task?.AssigneeId is not null && task.AssigneeId != dto.UserId)
        {
            var commenterName = await _db.Users
                .Where(u => u.Id == dto.UserId)
                .Select(u => u.FullName)
                .FirstOrDefaultAsync(ct) ?? "Alguien";

            await _notif.CreateAsync(
                task.AssigneeId.Value,
                "TaskCommented",
                $"Nuevo comentario en: {task.Title}",
                $"{commenterName} comentó en la tarea \"{task.Title}\" ({task.Project?.Name ?? "—"}).",
                "Task", task.Id, ct);
        }

        var loaded = await _db.TaskComments.AsNoTracking().Include(tc => tc.User)
            .FirstAsync(tc => tc.Id == entity.Id, ct);
        return Map(loaded);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TaskComments.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;
        _db.TaskComments.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static TaskCommentDto Map(TaskComment tc) => new()
    {
        Id = tc.Id,
        TaskId = tc.TaskId,
        UserId = tc.UserId,
        UserName = tc.User?.FullName ?? "—",
        Content = tc.Content,
        CreatedAt = tc.CreatedAt,
    };
}
