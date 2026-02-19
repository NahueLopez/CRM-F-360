using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Contacts;

public class ContactDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Position { get; set; }
    public string? Notes { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateContactDto
{
    [Required] public int CompanyId { get; set; }
    [Required][MaxLength(200)] public string FullName { get; set; } = null!;
    [MaxLength(200)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(100)] public string? Position { get; set; }
    [MaxLength(2000)] public string? Notes { get; set; }
}

public class UpdateContactDto
{
    [Required][MaxLength(200)] public string FullName { get; set; } = null!;
    [MaxLength(200)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(100)] public string? Position { get; set; }
    [MaxLength(2000)] public string? Notes { get; set; }
    public bool Active { get; set; } = true;
}
