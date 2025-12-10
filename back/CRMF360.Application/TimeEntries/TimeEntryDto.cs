namespace CRMF360.Application.TimeEntries;

public class TimeEntryDto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public int UsuarioId { get; set; }     
    public DateTime Fecha { get; set; }
    public decimal Horas { get; set; }
    public string? Descripcion { get; set; }
}

public class CreateTimeEntryRequest
{
    public int ProyectoId { get; set; }
    public int UsuarioId { get; set; }     
    public DateTime Fecha { get; set; }
    public decimal Horas { get; set; }
    public string? Descripcion { get; set; }
}

public interface ITimeEntryService
{
    Task<List<TimeEntryDto>> GetByProyectoAsync(int proyectoId);
    Task<List<TimeEntryDto>> GetByUsuarioAsync(int usuarioId);   
    Task<TimeEntryDto> CreateAsync(CreateTimeEntryRequest request);
    Task<bool> DeleteAsync(int id);
}
