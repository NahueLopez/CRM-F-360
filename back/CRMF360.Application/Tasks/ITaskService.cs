namespace CRMF360.Application.Tasks;

public interface ITaskService
{
    Task<List<TaskDto>> GetAllAsync(CancellationToken ct = default);
    Task<List<TaskDto>> GetByProjectAsync(int projectId, CancellationToken ct = default);
    Task<TaskDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TaskDto> CreateAsync(CreateTaskDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateTaskDto dto, CancellationToken ct = default);
    Task<bool> MoveAsync(int id, MoveTaskDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
