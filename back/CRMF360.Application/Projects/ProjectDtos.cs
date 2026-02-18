using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Projects;

public class ProjectDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDateEstimated { get; set; }
    public decimal? EstimatedHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TaskCount { get; set; }
}

public class CreateProjectDto
{
    [Required]
    public int CompanyId { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }
    public string Status { get; set; } = "Planned";
    public DateTime? StartDate { get; set; }
    public DateTime? EndDateEstimated { get; set; }

    [Range(0, 99999)]
    public decimal? EstimatedHours { get; set; }
}

public class UpdateProjectDto
{
    [Required]
    public int CompanyId { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    public string Status { get; set; } = null!;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDateEstimated { get; set; }

    [Range(0, 99999)]
    public decimal? EstimatedHours { get; set; }
}
