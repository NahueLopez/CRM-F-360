namespace CRMF360.Domain.Entities;

public class PersonaEmpresa
{
    public int Id { get; set; }

    public int EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;

    public string NombreCompleto { get; set; } = null!;
    public string? RolEnEmpresa { get; set; }  
    public string Email { get; set; } = null!;
    public string? Telefono { get; set; }

    public bool Principal { get; set; } = false;
    public bool Activa { get; set; } = true;
}
