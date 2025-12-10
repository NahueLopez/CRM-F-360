namespace CRMF360.Domain.Entities;

public class Tarea
{
    public int Id { get; set; }

    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }

    public int? AsignadoAId { get; set; }          
    public User? AsignadoA { get; set; }

    public DateTime? FechaVencimiento { get; set; }

    public EstadoTarea Estado { get; set; } = EstadoTarea.Pendiente;
    public PrioridadTarea Prioridad { get; set; } = PrioridadTarea.Media;

    public ICollection<TimeEntry> TimeEntries { get; set; } = new List<TimeEntry>();
}

public enum EstadoTarea
{
    Pendiente = 0,
    EnCurso = 1,
    Hecha = 2,
    Cancelada = 3
}

public enum PrioridadTarea
{
    Baja = 0,
    Media = 1,
    Alta = 2
}
