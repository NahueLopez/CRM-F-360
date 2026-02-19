namespace CRMF360.Application.TaskComments;

public interface ITaskCommentService
{
    Task<List<TaskCommentDto>> GetByTaskAsync(int taskId, CancellationToken ct = default);
    Task<TaskCommentDto> CreateAsync(CreateTaskCommentDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
