namespace CRMF360.Domain.Entities;

public class Company
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Cuit { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
