using CRMF360.Application.Abstractions;
using CRMF360.Application.Departments;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IApplicationDbContext _db;
    public DepartmentService(IApplicationDbContext db) => _db = db;

    public async Task<List<DepartmentDto>> GetAllAsync(CancellationToken ct = default)
        => await _db.Departments.AsNoTracking()
            .Where(d => !d.IsDeleted)
            .OrderBy(d => d.Name)
            .Select(d => Map(d))
            .ToListAsync(ct);

    public async Task<DepartmentDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var d = await _db.Departments.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, ct);
        return d is null ? null : Map(d);
    }

    public async Task<DepartmentDto> CreateAsync(CreateDepartmentDto dto, CancellationToken ct = default)
    {
        var entity = new Department
        {
            Name = dto.Name,
            Description = dto.Description,
            Color = dto.Color,
            CreatedAt = DateTime.UtcNow
        };
        _db.Departments.Add(entity);
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<DepartmentDto?> UpdateAsync(int id, UpdateDepartmentDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, ct);
        if (entity is null) return null;

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Color = dto.Color;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Departments.FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted, ct);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static DepartmentDto Map(Department d) => new()
    {
        Id = d.Id,
        Name = d.Name,
        Description = d.Description,
        Color = d.Color,
        UserCount = d.Users?.Count ?? 0,
        CreatedAt = d.CreatedAt
    };
}
