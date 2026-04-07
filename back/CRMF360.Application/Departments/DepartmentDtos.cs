using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Departments;

public class DepartmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public int UserCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDepartmentDto
{
    [Required][MaxLength(100)] public string Name { get; set; } = null!;
    [MaxLength(500)] public string? Description { get; set; }
    [MaxLength(20)] public string? Color { get; set; }
}

public class UpdateDepartmentDto
{
    [Required][MaxLength(100)] public string Name { get; set; } = null!;
    [MaxLength(500)] public string? Description { get; set; }
    [MaxLength(20)] public string? Color { get; set; }
}
