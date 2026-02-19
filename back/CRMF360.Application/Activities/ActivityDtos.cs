using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Activities;

public class ActivityLogDto
{
    public int Id { get; set; }
    public int? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public int? ContactId { get; set; }
    public string? ContactName { get; set; }
    public int? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string Description { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class CreateActivityDto
{
    public int? CompanyId { get; set; }
    public int? ContactId { get; set; }
    public int? ProjectId { get; set; }
    [Required] public int UserId { get; set; }
    [Required][MaxLength(50)] public string Type { get; set; } = "Note";
    [Required][MaxLength(4000)] public string Description { get; set; } = null!;
}
