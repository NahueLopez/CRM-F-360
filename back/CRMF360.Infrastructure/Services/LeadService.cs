using CRMF360.Application.Abstractions;
using CRMF360.Application.Common;
using CRMF360.Application.Leads;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class LeadService : ILeadService
{
    private readonly IApplicationDbContext _db;
    public LeadService(IApplicationDbContext db) => _db = db;

    public async Task<PagedResult<LeadDto>> GetPagedAsync(PaginationParams p, CancellationToken ct = default)
    {
        var query = _db.Leads.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.Search))
        {
            var pattern = $"%{p.Search}%";
            query = query.Where(l => EF.Functions.ILike(l.FullName, pattern)
                || (l.Email != null && EF.Functions.ILike(l.Email, pattern))
                || (l.Company != null && EF.Functions.ILike(l.Company, pattern)));
        }

        query = p.SortBy?.ToLower() switch
        {
            "name" or "fullname" => p.Descending ? query.OrderByDescending(l => l.FullName) : query.OrderBy(l => l.FullName),
            "status" => p.Descending ? query.OrderByDescending(l => l.Status) : query.OrderBy(l => l.Status),
            "source" => p.Descending ? query.OrderByDescending(l => l.Source) : query.OrderBy(l => l.Source),
            "createdat" => p.Descending ? query.OrderByDescending(l => l.CreatedAt) : query.OrderBy(l => l.CreatedAt),
            "value" => p.Descending ? query.OrderByDescending(l => l.EstimatedValue) : query.OrderBy(l => l.EstimatedValue),
            _ => query.OrderByDescending(l => l.CreatedAt),
        };

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(l => Map(l))
            .ToListAsync(ct);

        return new PagedResult<LeadDto>
        {
            Items = items,
            Page = p.Page,
            PageSize = p.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<LeadDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.Leads.AsNoTracking()
            .Include(l => l.AssignedTo)
            .FirstOrDefaultAsync(l => l.Id == id, ct);
        return e is null ? null : Map(e);
    }

    public async Task<LeadDto> CreateAsync(int userId, CreateLeadDto dto, CancellationToken ct = default)
    {
        Enum.TryParse<LeadSource>(dto.Source, true, out var source);

        var entity = new Lead
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Company = dto.Company,
            Position = dto.Position,
            Source = source,
            EstimatedValue = dto.EstimatedValue,
            Notes = dto.Notes,
            AssignedToId = dto.AssignedToId ?? userId,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Leads.Add(entity);
        await _db.SaveChangesAsync(ct);
        return (await GetByIdAsync(entity.Id, ct))!;
    }

    public async Task<bool> UpdateAsync(int id, UpdateLeadDto dto, CancellationToken ct = default)
    {
        var e = await _db.Leads.FindAsync(new object[] { id }, ct);
        if (e is null) return false;

        e.FullName = dto.FullName;
        e.Email = dto.Email;
        e.Phone = dto.Phone;
        e.Company = dto.Company;
        e.Position = dto.Position;
        e.EstimatedValue = dto.EstimatedValue;
        e.Notes = dto.Notes;
        if (dto.AssignedToId.HasValue) e.AssignedToId = dto.AssignedToId;

        if (dto.Status is not null && Enum.TryParse<LeadStatus>(dto.Status, true, out var status))
            e.Status = status;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.Leads.FindAsync(new object[] { id }, ct);
        if (e is null) return false;
        e.IsDeleted = true;
        e.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>
    /// Converts a Lead into a Contact + Deal. Updates the lead status to Converted.
    /// </summary>
    public async Task<LeadDto?> ConvertAsync(int id, ConvertLeadDto dto, CancellationToken ct = default)
    {
        var lead = await _db.Leads.FindAsync(new object[] { id }, ct);
        if (lead is null || lead.Status == LeadStatus.Converted) return null;

        // Create Contact from Lead
        var contact = new Contact
        {
            CompanyId = dto.CompanyId ?? 0,
            FullName = lead.FullName,
            Email = lead.Email,
            Phone = lead.Phone,
            Position = lead.Position,
            Notes = $"Convertido desde lead #{lead.Id}",
            CreatedAt = DateTime.UtcNow,
        };
        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync(ct);

        // Create Deal from Lead
        Enum.TryParse<DealStage>(dto.DealStage, true, out var stage);
        var deal = new Deal
        {
            Title = dto.DealTitle ?? $"Oportunidad: {lead.FullName}",
            CompanyId = dto.CompanyId,
            ContactId = contact.Id,
            AssignedToId = lead.AssignedToId ?? 1,
            Stage = stage,
            Value = lead.EstimatedValue,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Deals.Add(deal);
        await _db.SaveChangesAsync(ct);

        // Mark lead as converted
        lead.Status = LeadStatus.Converted;
        lead.ConvertedContactId = contact.Id;
        lead.ConvertedDealId = deal.Id;
        lead.ConvertedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return (await GetByIdAsync(id, ct))!;
    }

    private static LeadDto Map(Lead l) => new()
    {
        Id = l.Id,
        FullName = l.FullName,
        Email = l.Email,
        Phone = l.Phone,
        Company = l.Company,
        Position = l.Position,
        Source = l.Source.ToString(),
        Status = l.Status.ToString(),
        EstimatedValue = l.EstimatedValue,
        Notes = l.Notes,
        AssignedToId = l.AssignedToId,
        AssignedToName = l.AssignedTo?.FullName,
        ConvertedContactId = l.ConvertedContactId,
        ConvertedDealId = l.ConvertedDealId,
        CreatedAt = l.CreatedAt,
        ConvertedAt = l.ConvertedAt,
    };
}
