using CRMF360.Application.Abstractions;
using CRMF360.Application.Deals;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class DealService : IDealService
{
    private readonly IApplicationDbContext _db;
    public DealService(IApplicationDbContext db) => _db = db;

    public async Task<List<DealDto>> GetAllAsync(CancellationToken ct = default)
        => await Query().OrderBy(d => d.Stage).ThenBy(d => d.SortOrder)
            .Select(d => Map(d)).ToListAsync(ct);

    public async Task<List<DealDto>> GetByStageAsync(string stage, CancellationToken ct = default)
    {
        if (!Enum.TryParse<DealStage>(stage, out var s)) return new();
        return await Query().Where(d => d.Stage == s).OrderBy(d => d.SortOrder)
            .Select(d => Map(d)).ToListAsync(ct);
    }

    public async Task<DealDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var e = await Query().FirstOrDefaultAsync(d => d.Id == id, ct);
        return e is null ? null : Map(e);
    }

    public async Task<DealDto> CreateAsync(int userId, CreateDealDto dto, CancellationToken ct = default)
    {
        if (!Enum.TryParse<DealStage>(dto.Stage, out var stage)) stage = DealStage.Lead;
        var entity = new Deal
        {
            Title = dto.Title,
            CompanyId = dto.CompanyId,
            ContactId = dto.ContactId,
            AssignedToId = dto.AssignedToId ?? userId,
            Stage = stage,
            Value = dto.Value,
            Currency = dto.Currency ?? "ARS",
            Notes = dto.Notes,
            ExpectedCloseDate = dto.ExpectedCloseDate,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Deals.Add(entity);
        await _db.SaveChangesAsync(ct);
        var loaded = await Query().FirstAsync(d => d.Id == entity.Id, ct);
        return Map(loaded);
    }

    public async Task<bool> UpdateAsync(int id, UpdateDealDto dto, CancellationToken ct = default)
    {
        var e = await _db.Deals.FindAsync(new object[] { id }, ct);
        if (e is null) return false;
        e.Title = dto.Title;
        e.CompanyId = dto.CompanyId;
        e.ContactId = dto.ContactId;
        if (dto.AssignedToId.HasValue) e.AssignedToId = dto.AssignedToId.Value;
        e.Value = dto.Value;
        e.Currency = dto.Currency;
        e.Notes = dto.Notes;
        e.ExpectedCloseDate = dto.ExpectedCloseDate;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> MoveAsync(int id, MoveDealDto dto, CancellationToken ct = default)
    {
        var e = await _db.Deals.FindAsync(new object[] { id }, ct);
        if (e is null) return false;
        if (Enum.TryParse<DealStage>(dto.Stage, out var stage))
        {
            e.Stage = stage;
            e.SortOrder = dto.SortOrder;
            await _db.SaveChangesAsync(ct);
            return true;
        }
        return false;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.Deals.FindAsync(new object[] { id }, ct);
        if (e is null) return false;
        e.IsDeleted = true;
        e.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<PipelineSummaryDto>> GetSummaryAsync(CancellationToken ct = default)
        => await _db.Deals.AsNoTracking()
            .GroupBy(d => d.Stage)
            .Select(g => new PipelineSummaryDto
            {
                Stage = g.Key.ToString(),
                Count = g.Count(),
                TotalValue = g.Sum(d => d.Value ?? 0),
            })
            .ToListAsync(ct);

    private IQueryable<Deal> Query()
        => _db.Deals.AsNoTracking()
            .Include(d => d.Company)
            .Include(d => d.Contact)
            .Include(d => d.AssignedTo);

    private static DealDto Map(Deal d) => new()
    {
        Id = d.Id, Title = d.Title,
        CompanyId = d.CompanyId, CompanyName = d.Company?.Name,
        ContactId = d.ContactId, ContactName = d.Contact?.FullName,
        AssignedToId = d.AssignedToId, AssignedToName = d.AssignedTo?.FullName ?? "—",
        Stage = d.Stage.ToString(), Value = d.Value, Currency = d.Currency,
        Notes = d.Notes, ExpectedCloseDate = d.ExpectedCloseDate,
        SortOrder = d.SortOrder, CreatedAt = d.CreatedAt,
    };
}
