using CRMF360.Application.TimeEntries;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class TimeEntryService : ITimeEntryService
{
    private readonly ApplicationDbContext _context;

    public TimeEntryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TimeEntryDto>> GetByProyectoAsync(int proyectoId)
    {
        var query = await _context.TimeEntries
            .Where(t => t.ProyectoId == proyectoId)
            .ToListAsync();

        return query.Select(MapToDto).ToList();
    }

    public async Task<List<TimeEntryDto>> GetByUsuarioAsync(int usuarioId)   // 👈 Guid → int
    {
        var query = await _context.TimeEntries
            .Where(t => t.UsuarioId == usuarioId)   // 👈 ahora int == int ✔
            .ToListAsync();

        return query.Select(MapToDto).ToList();
    }

    public async Task<TimeEntryDto> CreateAsync(CreateTimeEntryRequest request)
    {
        var entity = new TimeEntry
        {
            ProyectoId = request.ProyectoId,
            UsuarioId = request.UsuarioId,   // 👈 asegurate que sea int en el DTO
            Fecha = request.Fecha,
            Horas = request.Horas,
            Descripcion = request.Descripcion
        };

        _context.TimeEntries.Add(entity);
        await _context.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.TimeEntries.FindAsync(id);
        if (entity == null) return false;

        _context.TimeEntries.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static TimeEntryDto MapToDto(TimeEntry t) => new()
    {
        Id = t.Id,
        ProyectoId = t.ProyectoId,
        UsuarioId = t.UsuarioId,   // 👈 int
        Fecha = t.Fecha,
        Horas = t.Horas,
        Descripcion = t.Descripcion
    };
}
