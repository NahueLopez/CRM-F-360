using CRMF360.Application.Abstractions;
using CRMF360.Application.BoardColumns;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class BoardColumnService : IBoardColumnService
{
    private readonly IApplicationDbContext _db;

    public BoardColumnService(IApplicationDbContext db) => _db = db;

    public async Task<List<BoardColumnDto>> GetByProjectAsync(int projectId, CancellationToken ct = default)
    {
        return await _db.BoardColumns
            .AsNoTracking()
            .Where(bc => bc.ProjectId == projectId)
            .OrderBy(bc => bc.SortOrder)
            .Select(bc => new BoardColumnDto
            {
                Id = bc.Id,
                ProjectId = bc.ProjectId,
                Name = bc.Name,
                SortOrder = bc.SortOrder,
                TaskCount = bc.Tasks.Count,
            })
            .ToListAsync(ct);
    }

    public async Task<BoardColumnDto> CreateAsync(CreateBoardColumnDto dto, CancellationToken ct = default)
    {
        var maxSort = await _db.BoardColumns
            .Where(bc => bc.ProjectId == dto.ProjectId)
            .Select(bc => (int?)bc.SortOrder)
            .MaxAsync(ct) ?? -1;

        var entity = new BoardColumn
        {
            ProjectId = dto.ProjectId,
            Name = dto.Name,
            SortOrder = maxSort + 1,
        };

        _db.BoardColumns.Add(entity);
        await _db.SaveChangesAsync(ct);

        return new BoardColumnDto
        {
            Id = entity.Id,
            ProjectId = entity.ProjectId,
            Name = entity.Name,
            SortOrder = entity.SortOrder,
            TaskCount = 0,
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateBoardColumnDto dto, CancellationToken ct = default)
    {
        var entity = await _db.BoardColumns.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        entity.Name = dto.Name;
        entity.SortOrder = dto.SortOrder;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.BoardColumns.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        _db.BoardColumns.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
