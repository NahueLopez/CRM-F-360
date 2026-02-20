using CRMF360.Application.Abstractions;
using CRMF360.Application.Notifications;
using CRMF360.Application.Tasks;
using CRMF360.Domain;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using TaskEntity = CRMF360.Domain.Entities.Task;

namespace CRMF360.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly IApplicationDbContext _db;
    private readonly INotificationService _notif;

    public TaskService(IApplicationDbContext db, INotificationService notif)
    {
        _db = db;
        _notif = notif;
    }

    public async Task<List<TaskDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await QueryBase()
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => MapToDto(t))
            .ToListAsync(ct);
    }

    public async Task<List<TaskDto>> GetByProjectAsync(int projectId, CancellationToken ct = default)
    {
        return await QueryBase()
            .Where(t => t.ProjectId == projectId)
            .OrderBy(t => t.SortOrder)
            .Select(t => MapToDto(t))
            .ToListAsync(ct);
    }

    public async Task<TaskDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await QueryBase()
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task<TaskDto> CreateAsync(CreateTaskDto dto, CancellationToken ct = default)
    {
        if (!Enum.TryParse<TaskPriority>(dto.Priority, true, out var priority))
            priority = TaskPriority.Medium;

        // Auto SortOrder: al final de la columna o del proyecto
        var maxSort = await _db.Tasks
            .Where(t => t.ProjectId == dto.ProjectId && t.ColumnId == dto.ColumnId)
            .Select(t => (int?)t.SortOrder)
            .MaxAsync(ct) ?? -1;

        var entity = new TaskEntity
        {
            ProjectId = dto.ProjectId,
            ColumnId = dto.ColumnId,
            AssigneeId = dto.AssigneeId,
            Title = dto.Title,
            Description = dto.Description,
            Priority = priority,
            SortOrder = maxSort + 1,
            DueDate = ToUtc(dto.DueDate),
            CreatedAt = DateTime.UtcNow,
        };

        _db.Tasks.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Notify assignee
        if (entity.AssigneeId.HasValue)
        {
            var project = await _db.Projects.FindAsync(new object[] { dto.ProjectId }, ct);
            await _notif.CreateAsync(
                entity.AssigneeId.Value,
                "TaskAssigned",
                $"Nueva tarea asignada: {entity.Title}",
                $"Se te asignó la tarea \"{entity.Title}\" en el proyecto {project?.Name ?? "—"}.",
                "Task", entity.Id, ct);
        }

        // Reload
        var loaded = await QueryBase().FirstAsync(t => t.Id == entity.Id, ct);
        return MapToDto(loaded);
    }

    public async Task<bool> UpdateAsync(int id, UpdateTaskDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entity is null) return false;

        var previousAssignee = entity.AssigneeId;

        if (!Enum.TryParse<TaskPriority>(dto.Priority, true, out var priority))
            priority = TaskPriority.Medium;

        entity.ColumnId = dto.ColumnId;
        entity.AssigneeId = dto.AssigneeId;
        entity.Title = dto.Title;
        entity.Description = dto.Description;
        entity.Priority = priority;
        entity.DueDate = ToUtc(dto.DueDate);

        await _db.SaveChangesAsync(ct);

        // Notify new assignee (only if changed)
        if (dto.AssigneeId.HasValue && dto.AssigneeId != previousAssignee)
        {
            await _notif.CreateAsync(
                dto.AssigneeId.Value,
                "TaskAssigned",
                $"Tarea asignada: {entity.Title}",
                $"Se te asignó la tarea \"{entity.Title}\" en el proyecto {entity.Project?.Name ?? "—"}.",
                "Task", entity.Id, ct);
        }

        return true;
    }

    public async Task<bool> MoveAsync(int id, MoveTaskDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Tasks.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        entity.ColumnId = dto.ColumnId;

        // Get all tasks in the target column, ordered by current SortOrder
        var columnTasks = await _db.Tasks
            .Where(t => t.ColumnId == dto.ColumnId && t.Id != id)
            .OrderBy(t => t.SortOrder)
            .ToListAsync(ct);

        // Insert the moved task at the desired position
        var insertAt = Math.Clamp(dto.SortOrder, 0, columnTasks.Count);
        columnTasks.Insert(insertAt, entity);

        // Reassign sequential SortOrders
        for (int i = 0; i < columnTasks.Count; i++)
        {
            columnTasks[i].SortOrder = i;
        }

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Tasks.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        _db.Tasks.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private IQueryable<TaskEntity> QueryBase()
    {
        return _db.Tasks
            .AsNoTracking()
            .Include(t => t.Project)
            .Include(t => t.Column)
            .Include(t => t.Assignee);
    }

    private static TaskDto MapToDto(TaskEntity t) => new()
    {
        Id = t.Id,
        ProjectId = t.ProjectId,
        ProjectName = t.Project?.Name ?? "—",
        ColumnId = t.ColumnId,
        ColumnName = t.Column?.Name,
        AssigneeId = t.AssigneeId,
        AssigneeName = t.Assignee?.FullName,
        Title = t.Title,
        Description = t.Description,
        Priority = t.Priority.ToString(),
        SortOrder = t.SortOrder,
        DueDate = t.DueDate,
        CreatedAt = t.CreatedAt,
    };

    private static DateTime? ToUtc(DateTime? dt) => DateTimeHelper.ToUtc(dt);
}
