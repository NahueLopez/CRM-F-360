using CRMF360.Application.Abstractions;
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
            Notes = dto.Notes,
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
        entity.Notes = dto.Notes;
        entity.Active = dto.Active;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Companies.FindAsync(new object[] { id }, ct);
        if (entity is null) return false;

        _db.Companies.Remove(entity);
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
        Notes = c.Notes,
        Active = c.Active,
        CreatedAt = c.CreatedAt,
    };
}
