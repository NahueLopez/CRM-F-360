namespace CRMF360.Domain.Entities;

public class Empresa
{
    public int Id { get; set; }
    public string RazonSocial { get; set; } = null!;
    public string? NombreFantasia { get; set; }
    public string? Cuit { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public bool Activa { get; set; } = true;
    public DateTime FechaAlta { get; set; } = DateTime.UtcNow;
    public ICollection<PersonaEmpresa> Personas { get; set; } = new List<PersonaEmpresa>();
    public ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
}
