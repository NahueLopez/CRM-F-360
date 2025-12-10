using CRMF360.Application.Empresas;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class EmpresaService : IEmpresaService
{
    private readonly ApplicationDbContext _context;

    public EmpresaService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<EmpresaDto>> GetEmpresasAsync(string? search)
    {
        var query = _context.Empresas.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(e =>
                e.RazonSocial.Contains(search) ||
                (e.NombreFantasia != null && e.NombreFantasia.Contains(search)) ||
                (e.Cuit != null && e.Cuit.Contains(search)));
        }

        var list = await query
            .OrderBy(e => e.RazonSocial)
            .ToListAsync();

        return list.Select(e => new EmpresaDto
        {
            Id = e.Id,
            RazonSocial = e.RazonSocial,
            NombreFantasia = e.NombreFantasia,
            Cuit = e.Cuit,
            Email = e.Email,
            Telefono = e.Telefono,
            Direccion = e.Direccion,
            FechaAlta = e.FechaAlta,
            Activa = e.Activa
        }).ToList();
    }

    public async Task<EmpresaDto?> GetByIdAsync(int id)
    {
        var e = await _context.Empresas.FirstOrDefaultAsync(x => x.Id == id);
        if (e == null) return null;

        return new EmpresaDto
        {
            Id = e.Id,
            RazonSocial = e.RazonSocial,
            NombreFantasia = e.NombreFantasia,
            Cuit = e.Cuit,
            Email = e.Email,
            Telefono = e.Telefono,
            Direccion = e.Direccion,
            FechaAlta = e.FechaAlta,
            Activa = e.Activa
        };
    }

    public async Task<EmpresaDto> CreateAsync(CreateEmpresaRequest request)
    {
        var entity = new Empresa
        {
            RazonSocial = request.RazonSocial,
            NombreFantasia = request.NombreFantasia,
            Cuit = request.Cuit,
            Email = request.Email,
            Telefono = request.Telefono,
            Direccion = request.Direccion,
            FechaAlta = DateTime.UtcNow,
            Activa = true
        };

        _context.Empresas.Add(entity);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException("Error al crear empresa.");
    }

    public async Task<bool> UpdateAsync(int id, UpdateEmpresaRequest request)
    {
        var entity = await _context.Empresas.FindAsync(id);
        if (entity == null) return false;

        entity.RazonSocial = request.RazonSocial;
        entity.NombreFantasia = request.NombreFantasia;
        entity.Cuit = request.Cuit;
        entity.Email = request.Email;
        entity.Telefono = request.Telefono;
        entity.Direccion = request.Direccion;
        entity.Activa = request.Activa;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var entity = await _context.Empresas.FindAsync(id);
        if (entity == null) return false;

        entity.Activa = false;
        await _context.SaveChangesAsync();
        return true;
    }
}
