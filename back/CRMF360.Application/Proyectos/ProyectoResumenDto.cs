using CRMF360.Domain.Entities;

namespace CRMF360.Application.Proyectos;

public class ProyectoResumenDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }

    public int EmpresaId { get; set; }
    public string EmpresaNombre { get; set; } = null!;

    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public EstadoProyecto Estado { get; set; }

    public decimal? HorasEstimadasTotales { get; set; }
    public decimal? HorasEstimadasMensuales { get; set; }

    public decimal HorasCargadas { get; set; }
    public decimal? PorcentajeAvance { get; set; }
}
