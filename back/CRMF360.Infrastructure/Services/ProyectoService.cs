using CRMF360.Application.Empresas;
using CRMF360.Application.Proyectos;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;


namespace CRMF360.Infrastructure.Services;

public class ProyectoService : IProyectoService
{
    private readonly ApplicationDbContext _context;

    public ProyectoService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProyectoDto>> GetAllAsync()
    {
        var proyectos = await _context.Proyectos
            .AsNoTracking()
            .OrderBy(p => p.Nombre)
            .ToListAsync();

        return proyectos.Select(p => new ProyectoDto
        {
            Id = p.Id,
            EmpresaId = p.EmpresaId,
            Nombre = p.Nombre,
            Descripcion = p.Descripcion,
            FechaInicio = p.FechaInicio,
            FechaFin = p.FechaFin,
            EstadoId = (int)p.Estado,
            EstadoNombre = p.Estado.ToString(),
            HorasEstimadasTotales = p.HorasEstimadasTotales,
            HorasEstimadasMensuales = p.HorasEstimadasMensuales
        }).ToList();
    }

    public async Task<List<ProyectoDto>> GetByEmpresaAsync(int empresaId)
    {
        var proyectos = await _context.Proyectos
            .Where(p => p.EmpresaId == empresaId)
            .ToListAsync();

        return proyectos.Select(p => new ProyectoDto
        {
            Id = p.Id,
            EmpresaId = p.EmpresaId,
            Nombre = p.Nombre,
            Descripcion = p.Descripcion,
            FechaInicio = p.FechaInicio,
            FechaFin = p.FechaFin,
            EstadoId = (int)p.Estado,
            EstadoNombre = p.Estado.ToString(),
            HorasEstimadasTotales = p.HorasEstimadasTotales,
            HorasEstimadasMensuales = p.HorasEstimadasMensuales
        }).ToList();
    }

    public async Task<ProyectoDto?> GetByIdAsync(int id)
    {
        var p = await _context.Proyectos.FindAsync(id);
        if (p == null) return null;

        return new ProyectoDto
        {
            Id = p.Id,
            EmpresaId = p.EmpresaId,
            Nombre = p.Nombre,
            Descripcion = p.Descripcion,
            FechaInicio = p.FechaInicio,
            FechaFin = p.FechaFin,
            EstadoId = (int)p.Estado,
            EstadoNombre = p.Estado.ToString(),
            HorasEstimadasTotales = p.HorasEstimadasTotales,
            HorasEstimadasMensuales = p.HorasEstimadasMensuales
        };
    }

    public async Task<ProyectoDto> CreateAsync(CreateProyectoRequest request)
    {
        var empresa = await _context.Empresas.FindAsync(request.EmpresaId);
        if (empresa == null)
            throw new InvalidOperationException($"No existe EmpresaId={request.EmpresaId}");

        if (!Enum.IsDefined(typeof(EstadoProyecto), request.EstadoId))
            throw new InvalidOperationException($"EstadoId inválido: {request.EstadoId}");

        var entity = new Proyecto
        {
            EmpresaId = request.EmpresaId,
            Nombre = request.Nombre,
            Descripcion = request.Descripcion,
            FechaInicio = request.FechaInicio,
            FechaFin = request.FechaFin,
            Estado = (EstadoProyecto)request.EstadoId,
            HorasEstimadasTotales = request.HorasEstimadasTotales,
            HorasEstimadasMensuales = request.HorasEstimadasMensuales
        };

        _context.Proyectos.Add(entity);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(entity.Id)
               ?? throw new InvalidOperationException("Error al crear proyecto.");
    }

    public async Task<bool> UpdateAsync(int id, UpdateProyectoRequest request)
    {
        var p = await _context.Proyectos.FindAsync(id);
        if (p == null) return false;

        if (!Enum.IsDefined(typeof(EstadoProyecto), request.EstadoId))
            throw new InvalidOperationException($"EstadoId inválido: {request.EstadoId}");

        p.Nombre = request.Nombre;
        p.Descripcion = request.Descripcion;
        p.FechaInicio = request.FechaInicio;
        p.FechaFin = request.FechaFin;
        p.Estado = (EstadoProyecto)request.EstadoId;
        p.HorasEstimadasTotales = request.HorasEstimadasTotales;
        p.HorasEstimadasMensuales = request.HorasEstimadasMensuales;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var p = await _context.Proyectos.FindAsync(id);
        if (p == null) return false;

        _context.Proyectos.Remove(p);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ProyectoResumenDto?> GetResumenAsync(int proyectoId)
    {
        var proyecto = await _context.Proyectos
            .Include(p => p.Empresa)
            .FirstOrDefaultAsync(p => p.Id == proyectoId);

        if (proyecto == null)
            return null;

        var horasCargadas = await _context.TimeEntries
            .Where(t => t.ProyectoId == proyectoId)
            .SumAsync(t => t.Horas);

        decimal? porcentajeAvance = null;
        if (proyecto.HorasEstimadasTotales.HasValue && proyecto.HorasEstimadasTotales.Value > 0)
        {
            porcentajeAvance = Math.Round(
                (horasCargadas / proyecto.HorasEstimadasTotales.Value) * 100m,
                2
            );
        }

        return new ProyectoResumenDto
        {
            Id = proyecto.Id,
            Nombre = proyecto.Nombre,
            Descripcion = proyecto.Descripcion,
            EmpresaId = proyecto.EmpresaId,
            EmpresaNombre = proyecto.Empresa.RazonSocial,
            FechaInicio = proyecto.FechaInicio,
            FechaFin = proyecto.FechaFin,
            Estado = proyecto.Estado,
            HorasEstimadasTotales = proyecto.HorasEstimadasTotales,
            HorasEstimadasMensuales = proyecto.HorasEstimadasMensuales,
            HorasCargadas = horasCargadas,
            PorcentajeAvance = porcentajeAvance
        };
    }
}
