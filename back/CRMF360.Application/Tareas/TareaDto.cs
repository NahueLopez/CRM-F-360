using CRMF360.Domain.Entities;

namespace CRMF360.Application.Tareas;

public class TareaDto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }

    public int? AsignadoAId { get; set; }
    public string? AsignadoAName { get; set; }

    public DateTime? FechaVencimiento { get; set; }

    public EstadoTarea Estado { get; set; }
    public PrioridadTarea Prioridad { get; set; }
}

public class CreateTareaRequest
{
    public int ProyectoId { get; set; }
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }

    public int? AsignadoAId { get; set; }
    public DateTime? FechaVencimiento { get; set; }

    public PrioridadTarea Prioridad { get; set; } = PrioridadTarea.Media;
}

public class UpdateTareaRequest
{
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }

    public int? AsignadoAId { get; set; }
    public DateTime? FechaVencimiento { get; set; }

    public EstadoTarea Estado { get; set; }
    public PrioridadTarea Prioridad { get; set; }
}

public interface ITareaService
{
    Task<List<TareaDto>> GetByProyectoAsync(int proyectoId);
    Task<List<TareaDto>> GetByUsuarioAsync(int userId);
    Task<TareaDto?> GetByIdAsync(int id);
    Task<TareaDto> CreateAsync(CreateTareaRequest request);
    Task<bool> UpdateAsync(int id, UpdateTareaRequest request);
    Task<bool> DeleteAsync(int id);
}
