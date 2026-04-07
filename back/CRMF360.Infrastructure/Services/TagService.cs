using CRMF360.Application.Abstractions;
using CRMF360.Application.Tags;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class TagService : ITagService
{
    private readonly IApplicationDbContext _db;
    public TagService(IApplicationDbContext db) => _db = db;

    // ── CRUD ──
    public async Task<List<TagDto>> GetAllAsync(CancellationToken ct = default)
        => await _db.Tags.AsNoTracking()
            .OrderBy(t => t.Name)
            .Select(t => Map(t))
            .ToListAsync(ct);

    public async Task<TagDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var t = await _db.Tags.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);
        return t is null ? null : Map(t);
    }

    public async Task<TagDto> CreateAsync(CreateTagDto dto, CancellationToken ct = default)
    {
        var entity = new Tag { Name = dto.Name, Color = dto.Color, CreatedAt = DateTime.UtcNow };
        _db.Tags.Add(entity);
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<TagDto?> UpdateAsync(int id, UpdateTagDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Tags.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entity is null) return null;
        entity.Name = dto.Name;
        entity.Color = dto.Color;
        await _db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Tags.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (entity is null) return false;
        _db.Tags.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ── Company Tags ──
    public async Task<bool> AssignToCompanyAsync(int companyId, int tagId, CancellationToken ct = default)
    {
        if (await _db.CompanyTags.AnyAsync(ct => ct.CompanyId == companyId && ct.TagId == tagId, ct))
            return true; // already assigned
        _db.CompanyTags.Add(new CompanyTag { CompanyId = companyId, TagId = tagId });
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UnassignFromCompanyAsync(int companyId, int tagId, CancellationToken ct = default)
    {
        var link = await _db.CompanyTags.FirstOrDefaultAsync(ct => ct.CompanyId == companyId && ct.TagId == tagId, ct);
        if (link is null) return false;
        _db.CompanyTags.Remove(link);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<TagDto>> GetByCompanyAsync(int companyId, CancellationToken ct = default)
        => await _db.CompanyTags.AsNoTracking()
            .Where(ct => ct.CompanyId == companyId)
            .Select(ct => Map(ct.Tag))
            .ToListAsync(ct);

    // ── Contact Tags ──
    public async Task<bool> AssignToContactAsync(int contactId, int tagId, CancellationToken ct = default)
    {
        if (await _db.ContactTags.AnyAsync(ct => ct.ContactId == contactId && ct.TagId == tagId, ct))
            return true;
        _db.ContactTags.Add(new ContactTag { ContactId = contactId, TagId = tagId });
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UnassignFromContactAsync(int contactId, int tagId, CancellationToken ct = default)
    {
        var link = await _db.ContactTags.FirstOrDefaultAsync(ct => ct.ContactId == contactId && ct.TagId == tagId, ct);
        if (link is null) return false;
        _db.ContactTags.Remove(link);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<TagDto>> GetByContactAsync(int contactId, CancellationToken ct = default)
        => await _db.ContactTags.AsNoTracking()
            .Where(ct => ct.ContactId == contactId)
            .Select(ct => Map(ct.Tag))
            .ToListAsync(ct);

    // ── Deal Tags ──
    public async Task<bool> AssignToDealAsync(int dealId, int tagId, CancellationToken ct = default)
    {
        if (await _db.DealTags.AnyAsync(dt => dt.DealId == dealId && dt.TagId == tagId, ct))
            return true;
        _db.DealTags.Add(new DealTag { DealId = dealId, TagId = tagId });
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> UnassignFromDealAsync(int dealId, int tagId, CancellationToken ct = default)
    {
        var link = await _db.DealTags.FirstOrDefaultAsync(dt => dt.DealId == dealId && dt.TagId == tagId, ct);
        if (link is null) return false;
        _db.DealTags.Remove(link);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<TagDto>> GetByDealAsync(int dealId, CancellationToken ct = default)
        => await _db.DealTags.AsNoTracking()
            .Where(dt => dt.DealId == dealId)
            .Select(dt => Map(dt.Tag))
            .ToListAsync(ct);

    private static TagDto Map(Tag t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Color = t.Color,
        CreatedAt = t.CreatedAt
    };
}
