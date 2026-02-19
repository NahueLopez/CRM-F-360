using CRMF360.Application.Abstractions;
using CRMF360.Application.TaskComments;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class TaskCommentService : ITaskCommentService
{
    private readonly IApplicationDbContext _db;
    public TaskCommentService(IApplicationDbContext db) => _db = db;

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
