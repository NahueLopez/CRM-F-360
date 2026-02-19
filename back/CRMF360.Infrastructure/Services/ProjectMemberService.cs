using CRMF360.Application.Abstractions;
using CRMF360.Application.ProjectMembers;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class ProjectMemberService : IProjectMemberService
{
    private readonly IApplicationDbContext _db;

    public ProjectMemberService(IApplicationDbContext db) => _db = db;

    public async Task<List<ProjectMemberDto>> GetByProjectAsync(int projectId, CancellationToken ct = default)
    {
        return await _db.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.ProjectId == projectId)
            .Include(pm => pm.User)
            .OrderBy(pm => pm.Role)
            .ThenBy(pm => pm.User.FullName)
            .Select(pm => MapToDto(pm))
            .ToListAsync(ct);
    }

    public async Task<ProjectMemberDto?> AddMemberAsync(int projectId, AddProjectMemberDto dto, CancellationToken ct = default)
    {
        // Check if already a member
        var exists = await _db.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == dto.UserId, ct);

        if (exists) return null;

        var entity = new ProjectMember
        {
            ProjectId = projectId,
            UserId = dto.UserId,
            Role = dto.Role,
            CanManageTasks = dto.CanManageTasks,
            CanManageMembers = dto.CanManageMembers,
            CanManageBoard = dto.CanManageBoard,
            CanEditProject = dto.CanEditProject,
            JoinedAt = DateTime.UtcNow,
        };

        _db.ProjectMembers.Add(entity);
        await _db.SaveChangesAsync(ct);

        // Reload with user
        var loaded = await _db.ProjectMembers
            .AsNoTracking()
            .Include(pm => pm.User)
            .FirstAsync(pm => pm.Id == entity.Id, ct);

        return MapToDto(loaded);
    }

    public async Task<bool> UpdateRoleAsync(int projectId, int userId, UpdateProjectMemberDto dto, CancellationToken ct = default)
    {
        var entity = await _db.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId, ct);

        if (entity is null) return false;

        entity.Role = dto.Role;
        entity.CanManageTasks = dto.CanManageTasks;
        entity.CanManageMembers = dto.CanManageMembers;
        entity.CanManageBoard = dto.CanManageBoard;
        entity.CanEditProject = dto.CanEditProject;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RemoveMemberAsync(int projectId, int userId, CancellationToken ct = default)
    {
        var entity = await _db.ProjectMembers
            .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId, ct);

        if (entity is null) return false;

        _db.ProjectMembers.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> IsMemberAsync(int projectId, int userId, CancellationToken ct = default)
    {
        return await _db.ProjectMembers
            .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId, ct);
    }

    public async Task<HashSet<int>> GetProjectIdsForUserAsync(int userId, CancellationToken ct = default)
    {
        var ids = await _db.ProjectMembers
            .AsNoTracking()
            .Where(pm => pm.UserId == userId)
            .Select(pm => pm.ProjectId)
            .ToListAsync(ct);
        return ids.ToHashSet();
    }

    private static ProjectMemberDto MapToDto(ProjectMember pm) => new()
    {
        Id = pm.Id,
        ProjectId = pm.ProjectId,
        UserId = pm.UserId,
        UserName = pm.User?.FullName ?? "—",
        UserEmail = pm.User?.Email ?? "—",
        Role = pm.Role,
        CanManageTasks = pm.CanManageTasks,
        CanManageMembers = pm.CanManageMembers,
        CanManageBoard = pm.CanManageBoard,
        CanEditProject = pm.CanEditProject,
        JoinedAt = pm.JoinedAt,
    };
}
