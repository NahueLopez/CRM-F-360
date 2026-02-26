using CRMF360.Application.Abstractions;
using CRMF360.Application.Common;
using CRMF360.Application.Contacts;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class ContactService : IContactService
{
    private readonly IApplicationDbContext _db;
    public ContactService(IApplicationDbContext db) => _db = db;

    public async Task<List<ContactDto>> GetAllAsync(CancellationToken ct = default)
        => await _db.Contacts.AsNoTracking().Include(c => c.Company)
            .OrderBy(c => c.FullName)
            .Select(c => Map(c)).ToListAsync(ct);

    public async Task<PagedResult<ContactDto>> GetPagedAsync(PaginationParams p, CancellationToken ct = default)
    {
        var query = _db.Contacts.AsNoTracking().Include(c => c.Company).AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.Search))
        {
            var pattern = $"%{p.Search}%";
            query = query.Where(c => EF.Functions.ILike(c.FullName, pattern)
                || (c.Email != null && EF.Functions.ILike(c.Email, pattern))
                || (c.Phone != null && c.Phone.Contains(p.Search))
                || (c.Company != null && EF.Functions.ILike(c.Company.Name, pattern)));
        }

        query = p.SortBy?.ToLower() switch
        {
            "fullname" or "name" => p.Descending ? query.OrderByDescending(c => c.FullName) : query.OrderBy(c => c.FullName),
            "company" => p.Descending ? query.OrderByDescending(c => c.Company!.Name) : query.OrderBy(c => c.Company!.Name),
            "createdat" => p.Descending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
            _ => query.OrderBy(c => c.FullName),
        };

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(c => Map(c))
            .ToListAsync(ct);

        return new PagedResult<ContactDto>
        {
            Items = items,
            Page = p.Page,
            PageSize = p.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<List<ContactDto>> GetByCompanyAsync(int companyId, CancellationToken ct = default)
        => await _db.Contacts.AsNoTracking().Include(c => c.Company)
            .Where(c => c.CompanyId == companyId)
            .OrderBy(c => c.FullName)
            .Select(c => Map(c)).ToListAsync(ct);

    public async Task<ContactDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.Contacts.AsNoTracking().Include(c => c.Company)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
        return e is null ? null : Map(e);
    }

    public async Task<ContactDto> CreateAsync(CreateContactDto dto, CancellationToken ct = default)
    {
        var entity = new Contact
        {
            CompanyId = dto.CompanyId,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Position = dto.Position,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Contacts.Add(entity);
        await _db.SaveChangesAsync(ct);

        var loaded = await _db.Contacts.AsNoTracking().Include(c => c.Company)
            .FirstAsync(c => c.Id == entity.Id, ct);
        return Map(loaded);
    }

    public async Task<bool> UpdateAsync(int id, UpdateContactDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Contacts.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        entity.FullName = dto.FullName;
        entity.Email = dto.Email;
        entity.Phone = dto.Phone;
        entity.Position = dto.Position;
        entity.Notes = dto.Notes;
        entity.Active = dto.Active;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Contacts.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;
        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static ContactDto Map(Contact c) => new()
    {
        Id = c.Id,
        CompanyId = c.CompanyId,
        CompanyName = c.Company?.Name ?? "—",
        FullName = c.FullName,
        Email = c.Email,
        Phone = c.Phone,
        Position = c.Position,
        Notes = c.Notes,
        Active = c.Active,
        CreatedAt = c.CreatedAt,
    };
}
