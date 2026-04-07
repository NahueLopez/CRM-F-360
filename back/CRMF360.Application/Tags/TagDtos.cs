using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Tags;

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Color { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTagDto
{
    [Required][MaxLength(50)] public string Name { get; set; } = null!;
    [MaxLength(20)] public string? Color { get; set; }
}

public class UpdateTagDto
{
    [Required][MaxLength(50)] public string Name { get; set; } = null!;
    [MaxLength(20)] public string? Color { get; set; }
}

public class AssignTagDto
{
    [Required] public int TagId { get; set; }
}
