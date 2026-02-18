using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Tasks;

public class TaskDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public int? ColumnId { get; set; }
    public string? ColumnName { get; set; }
    public int? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string Priority { get; set; } = null!;
    public int SortOrder { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTaskDto
{
    [Required]
    public int ProjectId { get; set; }

    public int? ColumnId { get; set; }
    public int? AssigneeId { get; set; }

    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(300)]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium";
    public DateTime? DueDate { get; set; }
}

public class UpdateTaskDto
{
    public int? ColumnId { get; set; }
    public int? AssigneeId { get; set; }

    [Required(ErrorMessage = "El título es obligatorio")]
    [MaxLength(300)]
    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    public string Priority { get; set; } = null!;

    public DateTime? DueDate { get; set; }
}

public class MoveTaskDto
{
    [Required]
    public int ColumnId { get; set; }

    [Range(0, int.MaxValue)]
    public int SortOrder { get; set; }
}
