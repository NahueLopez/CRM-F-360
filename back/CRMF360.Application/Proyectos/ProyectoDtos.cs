namespace CRMF360.Application.Empresas;

public class ProyectoDto
{
    public int Id { get; set; }
    public int EmpresaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public int EstadoId { get; set; }
    public string EstadoNombre { get; set; } = null!;

    // 🔹 Horas estimadas
    public decimal? HorasEstimadasTotales { get; set; }
    public decimal? HorasEstimadasMensuales { get; set; }
}

public class CreateProyectoRequest
{
    public int EmpresaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public int EstadoId { get; set; }

    public decimal? HorasEstimadasTotales { get; set; }
    public decimal? HorasEstimadasMensuales { get; set; }
}

public class UpdateProyectoRequest
{
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public int EstadoId { get; set; }

    public decimal? HorasEstimadasTotales { get; set; }
    public decimal? HorasEstimadasMensuales { get; set; }
}
