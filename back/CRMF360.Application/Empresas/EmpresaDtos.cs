namespace CRMF360.Application.Empresas;

public class EmpresaDto
{
    public int Id { get; set; }
    public string RazonSocial { get; set; } = null!;
    public string? NombreFantasia { get; set; }
    public string? Cuit { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public DateTime FechaAlta { get; set; }
    public bool Activa { get; set; }
}

public class CreateEmpresaRequest
{
    public string RazonSocial { get; set; } = null!;
    public string? NombreFantasia { get; set; }
    public string? Cuit { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
}

public class UpdateEmpresaRequest
{
    public string RazonSocial { get; set; } = null!;
    public string? NombreFantasia { get; set; }
    public string? Cuit { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public bool Activa { get; set; }
}
