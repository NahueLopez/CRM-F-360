using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Companies;

public class CompanyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Cuit { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCompanyDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    [MaxLength(20)]
    public string? Cuit { get; set; }

    [EmailAddress(ErrorMessage = "Email inválido")]
    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    public string? Notes { get; set; }
}

public class UpdateCompanyDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    [MaxLength(20)]
    public string? Cuit { get; set; }

    [EmailAddress(ErrorMessage = "Email inválido")]
    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    public string? Notes { get; set; }
    public bool Active { get; set; }
}
