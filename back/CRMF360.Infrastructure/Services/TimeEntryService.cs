using CRMF360.Application.Abstractions;
using CRMF360.Application.TimeEntries;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class TimeEntryService : ITimeEntryService
{
    private readonly IApplicationDbContext _db;

    public TimeEntryService(IApplicationDbContext db) => _db = db;

    public async Task<List<TimeEntryDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await QueryBase()
            .OrderByDescending(te => te.Date)
            .Select(te => MapToDto(te))
            .ToListAsync(ct);
    }

    public async Task<List<TimeEntryDto>> GetByTaskAsync(int taskId, CancellationToken ct = default)
    {
        return await QueryBase()
            .Where(te => te.TaskId == taskId)
            .OrderByDescending(te => te.Date)
            .Select(te => MapToDto(te))
            .ToListAsync(ct);
    }

    public async Task<List<TimeEntryDto>> GetByUserAsync(int userId, CancellationToken ct = default)
    {
        return await QueryBase()
            .Where(te => te.UserId == userId)
            .OrderByDescending(te => te.Date)
            .Select(te => MapToDto(te))
            .ToListAsync(ct);
    }

    public async Task<TimeEntryDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await QueryBase()
            .FirstOrDefaultAsync(te => te.Id == id, ct);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task<TimeEntryDto> CreateAsync(CreateTimeEntryDto dto, CancellationToken ct = default)
    {
        var entity = new TimeEntry
        {
            TaskId = dto.TaskId,
            UserId = dto.UserId,
            Date = dto.Date,
            Hours = dto.Hours,
            Description = dto.Description,
        };

        _db.TimeEntries.Add(entity);
        await _db.SaveChangesAsync(ct);

        var loaded = await QueryBase().FirstAsync(te => te.Id == entity.Id, ct);
        return MapToDto(loaded);
    }

    public async Task<bool> UpdateAsync(int id, UpdateTimeEntryDto dto, CancellationToken ct = default)
    {
        var entity = await _db.TimeEntries.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        entity.Date = dto.Date;
        entity.Hours = dto.Hours;
        entity.Description = dto.Description;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TimeEntries.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        _db.TimeEntries.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private IQueryable<TimeEntry> QueryBase()
    {
        return _db.TimeEntries
            .AsNoTracking()
            .Include(te => te.Task)
            .Include(te => te.User);
    }

    private static TimeEntryDto MapToDto(TimeEntry te) => new()
    {
        Id = te.Id,
        TaskId = te.TaskId,
        TaskTitle = te.Task?.Title ?? "—",
        UserId = te.UserId,
        UserName = te.User?.FullName ?? "—",
        Date = te.Date,
        Hours = te.Hours,
        Description = te.Description,
        CreatedAt = te.CreatedAt,
    };
}
