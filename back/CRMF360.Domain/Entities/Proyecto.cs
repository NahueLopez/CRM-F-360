namespace CRMF360.Domain.Entities;

public class Proyecto
{
    public int Id { get; set; }

    public int EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;

    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }

    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public EstadoProyecto Estado { get; set; } = EstadoProyecto.Activo;

    public decimal? HorasEstimadasTotales { get; set; }
    public decimal? HorasEstimadasMensuales { get; set; }

    public ICollection<Tarea> Tareas { get; set; } = new List<Tarea>();

}

public enum EstadoProyecto
{
    Borrador = 0,
    Activo = 1,
    Pausado = 2,
    Cerrado = 3
}
