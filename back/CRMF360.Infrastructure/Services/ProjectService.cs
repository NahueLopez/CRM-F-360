using CRMF360.Application.Common;
using CRMF360.Application.Abstractions;
using CRMF360.Application.Projects;
using CRMF360.Domain;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly IApplicationDbContext _db;

    public ProjectService(IApplicationDbContext db) => _db = db;

    public async Task<List<ProjectDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Projects
            .AsNoTracking()
            .Include(p => p.Company)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                CompanyId = p.CompanyId,
                CompanyName = p.Company != null ? p.Company.Name : "—",
                Name = p.Name,
                Description = p.Description,
                Status = p.Status.ToString(),
                StartDate = p.StartDate,
                EndDateEstimated = p.EndDateEstimated,
                EstimatedHours = p.EstimatedHours,
                CreatedAt = p.CreatedAt,
                TaskCount = p.Tasks.Count, // Subquery count — no Include needed
            })
            .ToListAsync(ct);
    }

    public async Task<PagedResult<ProjectDto>> GetPagedAsync(PaginationParams p, List<int>? allowedProjectIds = null, string? status = null, CancellationToken ct = default)
    {
        var query = _db.Projects.AsNoTracking().AsQueryable();

        if (allowedProjectIds != null)
        {
            query = query.Where(proj => allowedProjectIds.Contains(proj.Id));
        }

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ProjectStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(proj => proj.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(p.Search))
        {
            var pattern = $"%{p.Search}%";
            query = query.Where(proj => EF.Functions.ILike(proj.Name, pattern)
                || (proj.Company != null && EF.Functions.ILike(proj.Company.Name, pattern)));
        }

        query = p.SortBy?.ToLower() switch
        {
            "name" => p.Descending ? query.OrderByDescending(proj => proj.Name) : query.OrderBy(proj => proj.Name),
            "createdat" => p.Descending ? query.OrderByDescending(proj => proj.CreatedAt) : query.OrderBy(proj => proj.CreatedAt),
            "status" => p.Descending ? query.OrderByDescending(proj => proj.Status) : query.OrderBy(proj => proj.Status),
            _ => query.OrderByDescending(proj => proj.CreatedAt)
        };

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Include(proj => proj.Company)
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(proj => new ProjectDto
            {
                Id = proj.Id,
                CompanyId = proj.CompanyId,
                CompanyName = proj.Company != null ? proj.Company.Name : "—",
                Name = proj.Name,
                Description = proj.Description,
                Status = proj.Status.ToString(),
                StartDate = proj.StartDate,
                EndDateEstimated = proj.EndDateEstimated,
                EstimatedHours = proj.EstimatedHours,
                CreatedAt = proj.CreatedAt,
                TaskCount = proj.Tasks.Count,
            })
            .ToListAsync(ct);

        return new PagedResult<ProjectDto>
        {
            Items = items,
            Page = p.Page,
            PageSize = p.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ProjectDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _db.Projects
            .AsNoTracking()
            .Include(p => p.Company)
            .Where(p => p.Id == id)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                CompanyId = p.CompanyId,
                CompanyName = p.Company != null ? p.Company.Name : "—",
                Name = p.Name,
                Description = p.Description,
                Status = p.Status.ToString(),
                StartDate = p.StartDate,
                EndDateEstimated = p.EndDateEstimated,
                EstimatedHours = p.EstimatedHours,
                CreatedAt = p.CreatedAt,
                TaskCount = p.Tasks.Count,
            })
            .FirstOrDefaultAsync(ct);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, CancellationToken ct = default)
    {
        if (!Enum.TryParse<ProjectStatus>(dto.Status, true, out var status))
            status = ProjectStatus.Planned;

        var entity = new Project
        {
            CompanyId = dto.CompanyId,
            Name = dto.Name,
            Description = dto.Description,
            Status = status,
            StartDate = ToUtc(dto.StartDate),
            EndDateEstimated = ToUtc(dto.EndDateEstimated),
            EstimatedHours = dto.EstimatedHours,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Projects.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Crear columnas Kanban por defecto
        var defaultColumns = new[] { "Backlog", "En progreso", "En revisión", "Hecho" };
        for (int i = 0; i < defaultColumns.Length; i++)
        {
            _db.BoardColumns.Add(new BoardColumn
            {
                ProjectId = entity.Id,
                Name = defaultColumns[i],
                SortOrder = i,
            });
        }
        await _db.SaveChangesAsync(ct);

        // Reload con includes
        var loaded = await _db.Projects
            .AsNoTracking()
            .Include(p => p.Company)
            .Include(p => p.Tasks)
            .FirstAsync(p => p.Id == entity.Id, ct);

        return MapToDto(loaded);
    }

    public async Task<bool> UpdateAsync(int id, UpdateProjectDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Projects.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        if (!Enum.TryParse<ProjectStatus>(dto.Status, true, out var status))
            status = ProjectStatus.Planned;

        entity.CompanyId = dto.CompanyId;
        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Status = status;
        entity.StartDate = ToUtc(dto.StartDate);
        entity.EndDateEstimated = ToUtc(dto.EndDateEstimated);
        entity.EstimatedHours = dto.EstimatedHours;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Projects.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static ProjectDto MapToDto(Project p) => new()
    {
        Id = p.Id,
        CompanyId = p.CompanyId,
        CompanyName = p.Company?.Name ?? "—",
        Name = p.Name,
        Description = p.Description,
        Status = p.Status.ToString(),
        StartDate = p.StartDate,
        EndDateEstimated = p.EndDateEstimated,
        EstimatedHours = p.EstimatedHours,
        CreatedAt = p.CreatedAt,
        TaskCount = p.Tasks?.Count ?? 0,
    };

    private static DateTime? ToUtc(DateTime? dt) => DateTimeHelper.ToUtc(dt);
}
