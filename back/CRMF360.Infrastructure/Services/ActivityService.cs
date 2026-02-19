using CRMF360.Application.Abstractions;
using CRMF360.Application.Activities;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class ActivityService : IActivityService
{
    private readonly IApplicationDbContext _db;
    public ActivityService(IApplicationDbContext db) => _db = db;

    public async Task<List<ActivityLogDto>> GetByCompanyAsync(int companyId, CancellationToken ct = default)
        => await Query().Where(a => a.CompanyId == companyId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => Map(a)).ToListAsync(ct);

    public async Task<List<ActivityLogDto>> GetByContactAsync(int contactId, CancellationToken ct = default)
        => await Query().Where(a => a.ContactId == contactId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => Map(a)).ToListAsync(ct);

    public async Task<List<ActivityLogDto>> GetByProjectAsync(int projectId, CancellationToken ct = default)
        => await Query().Where(a => a.ProjectId == projectId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => Map(a)).ToListAsync(ct);

    public async Task<List<ActivityLogDto>> GetRecentAsync(int count = 20, CancellationToken ct = default)
        => await Query().OrderByDescending(a => a.CreatedAt)
            .Take(count)
            .Select(a => Map(a)).ToListAsync(ct);

    public async Task<ActivityLogDto> CreateAsync(CreateActivityDto dto, CancellationToken ct = default)
    {
        var entity = new ActivityLog
        {
            CompanyId = dto.CompanyId,
            ContactId = dto.ContactId,
            ProjectId = dto.ProjectId,
            UserId = dto.UserId,
            Type = dto.Type,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow,
        };
        _db.ActivityLogs.Add(entity);
        await _db.SaveChangesAsync(ct);

        var loaded = await Query().FirstAsync(a => a.Id == entity.Id, ct);
        return Map(loaded);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.ActivityLogs.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;
        _db.ActivityLogs.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private IQueryable<ActivityLog> Query()
        => _db.ActivityLogs.AsNoTracking()
            .Include(a => a.Company)
            .Include(a => a.Contact)
            .Include(a => a.Project)
            .Include(a => a.User);

    private static ActivityLogDto Map(ActivityLog a) => new()
    {
        Id = a.Id,
        CompanyId = a.CompanyId,
        CompanyName = a.Company?.Name,
        ContactId = a.ContactId,
        ContactName = a.Contact?.FullName,
        ProjectId = a.ProjectId,
        ProjectName = a.Project?.Name,
        UserId = a.UserId,
        UserName = a.User?.FullName ?? "—",
        Type = a.Type,
        Description = a.Description,
        CreatedAt = a.CreatedAt,
    };
}
