namespace CRMF360.Domain.Entities;

public class TimeEntry
{
    public int Id { get; set; }

    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    public int UsuarioId { get; set; }
    public User Usuario { get; set; } = null!;

    public int? TareaId { get; set; }       
    public Tarea? Tarea { get; set; }       
    public DateTime Fecha { get; set; }
    public decimal Horas { get; set; }
    public string? Descripcion { get; set; }
}

