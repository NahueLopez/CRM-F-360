using CRMF360.Application.Tareas;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class TareaService : ITareaService
{
    private readonly ApplicationDbContext _context;

    public TareaService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TareaDto>> GetByProyectoAsync(int proyectoId)
    {
        var tareas = await _context.Tareas
            .Include(t => t.AsignadoA)
            .Where(t => t.ProyectoId == proyectoId)
            .ToListAsync();

        return tareas.Select(MapToDto).ToList();
    }

    public async Task<List<TareaDto>> GetByUsuarioAsync(int userId)
    {
        var tareas = await _context.Tareas
            .Include(t => t.AsignadoA)
            .Where(t => t.AsignadoAId == userId)
            .ToListAsync();

        return tareas.Select(MapToDto).ToList();
    }

    public async Task<TareaDto?> GetByIdAsync(int id)
    {
        var tarea = await _context.Tareas
            .Include(t => t.AsignadoA)
            .FirstOrDefaultAsync(t => t.Id == id);

        return tarea == null ? null : MapToDto(tarea);
    }

    public async Task<TareaDto> CreateAsync(CreateTareaRequest request)
    {
        // validación básica: que exista el proyecto
        var proyectoExists = await _context.Proyectos
            .AnyAsync(p => p.Id == request.ProyectoId);

        if (!proyectoExists)
            throw new InvalidOperationException($"No existe ProyectoId={request.ProyectoId}");

        var entity = new Tarea
        {
            ProyectoId = request.ProyectoId,
            Titulo = request.Titulo,
            Descripcion = request.Descripcion,
            AsignadoAId = request.AsignadoAId,
            FechaVencimiento = request.FechaVencimiento,
            Prioridad = request.Prioridad,
            Estado = EstadoTarea.Pendiente
        };

        _context.Tareas.Add(entity);
        await _context.SaveChangesAsync();

        entity = await _context.Tareas
            .Include(t => t.AsignadoA)
            .FirstAsync(t => t.Id == entity.Id);

        return MapToDto(entity);
    }

    public async Task<bool> UpdateAsync(int id, UpdateTareaRequest request)
    {
        var entity = await _context.Tareas.FindAsync(id);
        if (entity == null) return false;

        entity.Titulo = request.Titulo;
        entity.Descripcion = request.Descripcion;
        entity.AsignadoAId = request.AsignadoAId;
        entity.FechaVencimiento = request.FechaVencimiento;
        entity.Estado = request.Estado;
        entity.Prioridad = request.Prioridad;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.Tareas.FindAsync(id);
        if (entity == null) return false;

        _context.Tareas.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static TareaDto MapToDto(Tarea t) => new()
    {
        Id = t.Id,
        ProyectoId = t.ProyectoId,
        Titulo = t.Titulo,
        Descripcion = t.Descripcion,
        AsignadoAId = t.AsignadoAId,
        AsignadoAName = t.AsignadoA != null ? t.AsignadoA.FullName : null,
        FechaVencimiento = t.FechaVencimiento,
        Estado = t.Estado,
        Prioridad = t.Prioridad
    };
}
