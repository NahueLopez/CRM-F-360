using CRMF360.Application.Abstractions;
using CRMF360.Application.Common;
using CRMF360.Application.Companies;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class CompanyService : ICompanyService
{
    private readonly IApplicationDbContext _db;

    public CompanyService(IApplicationDbContext db) => _db = db;

    public async Task<List<CompanyDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Companies
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => MapToDto(c))
            .ToListAsync(ct);
    }

    public async Task<PagedResult<CompanyDto>> GetPagedAsync(PaginationParams p, CancellationToken ct = default)
    {
        var query = _db.Companies.AsNoTracking().AsQueryable();

        // Search
        if (!string.IsNullOrWhiteSpace(p.Search))
        {
            var pattern = $"%{p.Search}%";
            query = query.Where(c => EF.Functions.ILike(c.Name, pattern)
                || (c.Cuit != null && c.Cuit.Contains(p.Search))
                || (c.Email != null && EF.Functions.ILike(c.Email, pattern)));
        }

        // Sort
        query = p.SortBy?.ToLower() switch
        {
            "name" => p.Descending ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name),
            "createdat" => p.Descending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
            _ => query.OrderBy(c => c.Name),
        };

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(c => MapToDto(c))
            .ToListAsync(ct);

        return new PagedResult<CompanyDto>
        {
            Items = items,
            Page = p.Page,
            PageSize = p.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<CompanyDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task<CompanyDto> CreateAsync(CreateCompanyDto dto, CancellationToken ct = default)
    {
        var entity = new Company
        {
            Name = dto.Name,
            Cuit = dto.Cuit,
            Email = dto.Email,
            Phone = dto.Phone,
            Industry = dto.Industry,
            Website = dto.Website,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Companies.Add(entity);
        await _db.SaveChangesAsync(ct);

        return MapToDto(entity);
    }

    public async Task<bool> UpdateAsync(int id, UpdateCompanyDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Companies.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        entity.Name = dto.Name;
        entity.Cuit = dto.Cuit;
        entity.Email = dto.Email;
        entity.Phone = dto.Phone;
        entity.Industry = dto.Industry;
        entity.Website = dto.Website;
        entity.Notes = dto.Notes;
        entity.Active = dto.Active;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Companies.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static CompanyDto MapToDto(Company c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Cuit = c.Cuit,
        Email = c.Email,
        Phone = c.Phone,
        Industry = c.Industry,
        Website = c.Website,
        Notes = c.Notes,
        Active = c.Active,
        CreatedAt = c.CreatedAt,
    };
}
