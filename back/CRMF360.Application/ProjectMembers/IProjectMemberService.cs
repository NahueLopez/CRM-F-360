namespace CRMF360.Application.ProjectMembers;

public interface IProjectMemberService
{
    Task<List<ProjectMemberDto>> GetByProjectAsync(int projectId, CancellationToken ct = default);
    Task<ProjectMemberDto?> AddMemberAsync(int projectId, AddProjectMemberDto dto, CancellationToken ct = default);
    Task<bool> UpdateRoleAsync(int projectId, int userId, UpdateProjectMemberDto dto, CancellationToken ct = default);
    Task<bool> RemoveMemberAsync(int projectId, int userId, CancellationToken ct = default);
    Task<bool> IsMemberAsync(int projectId, int userId, CancellationToken ct = default);

    /// <summary>Returns all project IDs where the user is a member (single query).</summary>
    Task<HashSet<int>> GetProjectIdsForUserAsync(int userId, CancellationToken ct = default);
}
