using CRMF360.Application.Common;

namespace CRMF360.Application.Projects;

public interface IProjectService
{
    Task<List<ProjectDto>> GetAllAsync(CancellationToken ct = default);
    Task<PagedResult<ProjectDto>> GetPagedAsync(PaginationParams p, List<int>? allowedProjectIds = null, string? status = null, CancellationToken ct = default);
    Task<ProjectDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ProjectDto> CreateAsync(CreateProjectDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateProjectDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
