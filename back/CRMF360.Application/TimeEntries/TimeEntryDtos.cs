using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.TimeEntries;

public class TimeEntryDto
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string TaskTitle { get; set; } = null!;
    public string ProjectName { get; set; } = null!;
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public DateTime Date { get; set; }
    public decimal Hours { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTimeEntryDto
{
    [Required]
    public int TaskId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Required]
    [Range(0.25, 24, ErrorMessage = "Las horas deben ser entre 0.25 y 24")]
    public decimal Hours { get; set; }

    public string? Description { get; set; }
}

public class UpdateTimeEntryDto
{
    [Required]
    public DateTime Date { get; set; }

    [Required]
    [Range(0.25, 24, ErrorMessage = "Las horas deben ser entre 0.25 y 24")]
    public decimal Hours { get; set; }

    public string? Description { get; set; }
}

/// <summary>Estimated vs logged hours per project — for managers/admins.</summary>
public class ProjectHoursSummaryDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string CompanyName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public decimal EstimatedHours { get; set; }
    public decimal LoggedHours { get; set; }
    /// <summary>LoggedHours - EstimatedHours. Positive = over budget.</summary>
    public decimal DeltaHours { get; set; }
    /// <summary>Percentage of estimated hours consumed (0-100+).</summary>
    public decimal BurnPercent { get; set; }
    public int TotalEntries { get; set; }
}

