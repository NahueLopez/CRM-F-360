using CRMF360.Application.Abstractions;
using CRMF360.Application.Reminders;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class ReminderService : IReminderService
{
    private readonly IApplicationDbContext _db;
    public ReminderService(IApplicationDbContext db) => _db = db;

    public async Task<List<ReminderDto>> GetByUserAsync(int userId, CancellationToken ct = default)
        => await Query().Where(r => r.UserId == userId)
            .OrderBy(r => r.IsCompleted).ThenBy(r => r.DueDate)
            .Select(r => Map(r)).ToListAsync(ct);

    public async Task<List<ReminderDto>> GetPendingAsync(int userId, CancellationToken ct = default)
        => await Query().Where(r => r.UserId == userId && !r.IsCompleted)
            .OrderBy(r => r.DueDate)
            .Select(r => Map(r)).ToListAsync(ct);

    public async Task<List<ReminderDto>> GetOverdueAsync(int userId, CancellationToken ct = default)
        => await Query().Where(r => r.UserId == userId && !r.IsCompleted && r.DueDate < DateTime.UtcNow)
            .OrderBy(r => r.DueDate)
            .Select(r => Map(r)).ToListAsync(ct);

    public async Task<ReminderDto> CreateAsync(int userId, CreateReminderDto dto, CancellationToken ct = default)
    {
        var entity = new Reminder
        {
            UserId = userId,
            ContactId = dto.ContactId,
            CompanyId = dto.CompanyId,
            ProjectId = dto.ProjectId,
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Reminders.Add(entity);
        await _db.SaveChangesAsync(ct);

        var loaded = await Query().FirstAsync(r => r.Id == entity.Id, ct);
        return Map(loaded);
    }

    public async Task<bool> ToggleCompleteAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.Reminders.FindAsync(new object[] { id }, ct);
        if (e is null) return false;
        e.IsCompleted = !e.IsCompleted;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.Reminders.FindAsync(new object[] { id }, ct);
        if (e is null) return false;
        _db.Reminders.Remove(e);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private IQueryable<Reminder> Query()
        => _db.Reminders.AsNoTracking()
            .Include(r => r.User)
            .Include(r => r.Contact)
            .Include(r => r.Company)
            .Include(r => r.Project);

    private static ReminderDto Map(Reminder r) => new()
    {
        Id = r.Id, UserId = r.UserId, UserName = r.User?.FullName ?? "—",
        ContactId = r.ContactId, ContactName = r.Contact?.FullName,
        CompanyId = r.CompanyId, CompanyName = r.Company?.Name,
        ProjectId = r.ProjectId, ProjectName = r.Project?.Name,
        Title = r.Title, Description = r.Description,
        DueDate = r.DueDate, IsCompleted = r.IsCompleted, CreatedAt = r.CreatedAt,
    };
}
