using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.TaskComments;

public class TaskCommentDto
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class CreateTaskCommentDto
{
    [Required] public int TaskId { get; set; }
    [Required] public int UserId { get; set; }
    [Required][MaxLength(4000)] public string Content { get; set; } = null!;
}
