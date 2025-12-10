namespace CRMF360.Application.PersonasEmpresa;

public class PersonaEmpresaDto
{
    public int Id { get; set; }
    public int EmpresaId { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public string? RolEnEmpresa { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public bool Principal { get; set; }
    public bool Activa { get; set; }
}

public class CreatePersonaEmpresaRequest
{
    public int EmpresaId { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public string? RolEnEmpresa { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public bool Principal { get; set; } = false;
}

public class UpdatePersonaEmpresaRequest
{
    public string NombreCompleto { get; set; } = null!;
    public string? RolEnEmpresa { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public bool Principal { get; set; }
    public bool Activa { get; set; }
}
