namespace CRMF360.Application.Workspaces;

public interface IWorkspaceService
{
    Task<List<WorkspaceDto>> GetAllAsync(CancellationToken ct = default);
    Task<WorkspaceDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<WorkspaceDto> CreateAsync(CreateWorkspaceDto dto, CancellationToken ct = default);
    Task<WorkspaceDto?> UpdateAsync(int id, UpdateWorkspaceDto dto, CancellationToken ct = default);
    
    Task<List<WorkspaceUserDto>> GetUsersAsync(int tenantId, CancellationToken ct = default);
    Task<bool> AssignUserAsync(int tenantId, AssignWorkspaceUserDto dto, CancellationToken ct = default);
    Task<bool> RemoveUserAsync(int tenantId, int userId, CancellationToken ct = default);
}
