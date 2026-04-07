using CRMF360.Application.Abstractions;
using CRMF360.Application.Workspaces;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class WorkspaceService : IWorkspaceService
{
    private readonly IApplicationDbContext _db;

    public WorkspaceService(IApplicationDbContext db) => _db = db;

    public async Task<List<WorkspaceDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Tenants.AsNoTracking()
            .Select(t => new WorkspaceDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Plan = t.Plan,
                Active = t.Active,
                CreatedAt = t.CreatedAt
            }).ToListAsync(ct);
    }

    public async Task<WorkspaceDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var t = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t is null) return null;
        return new WorkspaceDto
        {
            Id = t.Id,
            Name = t.Name,
            Slug = t.Slug,
            Plan = t.Plan,
            Active = t.Active,
            CreatedAt = t.CreatedAt
        };
    }

    public async Task<WorkspaceDto> CreateAsync(CreateWorkspaceDto dto, CancellationToken ct = default)
    {
        var tenant = new Tenant
        {
            Name = dto.Name,
            Slug = dto.Slug,
            Plan = dto.Plan,
            Active = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync(ct);
        
        return new WorkspaceDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Plan = tenant.Plan,
            Active = tenant.Active,
            CreatedAt = tenant.CreatedAt
        };
    }

    public async Task<WorkspaceDto?> UpdateAsync(int id, UpdateWorkspaceDto dto, CancellationToken ct = default)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (tenant is null) return null;

        tenant.Name = dto.Name;
        tenant.Slug = dto.Slug;
        tenant.Plan = dto.Plan;
        tenant.Active = dto.Active;

        await _db.SaveChangesAsync(ct);

        return new WorkspaceDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Slug = tenant.Slug,
            Plan = tenant.Plan,
            Active = tenant.Active,
            CreatedAt = tenant.CreatedAt
        };
    }

    // ─── USER ASSIGNMENT ───

    public async Task<List<WorkspaceUserDto>> GetUsersAsync(int tenantId, CancellationToken ct = default)
    {
        // Encontramos todos los usuarios que tienen un rol en este tenant
        var userRoles = await _db.UserRoles.IgnoreQueryFilters()
            .Include(ur => ur.User)
            .Include(ur => ur.Role)
            .Where(ur => ur.TenantId == tenantId)
            .ToListAsync(ct);

        return userRoles.Select(ur => new WorkspaceUserDto
        {
            UserId = ur.UserId,
            FullName = ur.User.FullName,
            Email = ur.User.Email,
            Active = ur.User.Active,
            RoleId = ur.RoleId,
            RoleName = ur.Role?.Name
        }).ToList();
    }

    public async Task<bool> AssignUserAsync(int tenantId, AssignWorkspaceUserDto dto, CancellationToken ct = default)
    {
        var userExists = await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Id == dto.UserId, ct);
        if (!userExists) return false;

        var roleExists = await _db.Roles.IgnoreQueryFilters().AnyAsync(r => r.Id == dto.RoleId, ct);
        if (!roleExists) return false;

        var tenantExists = await _db.Tenants.AnyAsync(t => t.Id == tenantId, ct);
        if (!tenantExists) return false;

        var existingUserRole = await _db.UserRoles.IgnoreQueryFilters()
            .FirstOrDefaultAsync(ur => ur.TenantId == tenantId && ur.UserId == dto.UserId, ct);

        if (existingUserRole != null)
        {
            existingUserRole.RoleId = dto.RoleId; // update role
        }
        else
        {
            _db.UserRoles.Add(new UserRole
            {
                TenantId = tenantId,
                UserId = dto.UserId,
                RoleId = dto.RoleId
            });
        }
        
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RemoveUserAsync(int tenantId, int userId, CancellationToken ct = default)
    {
        var existingUserRole = await _db.UserRoles.IgnoreQueryFilters()
            .FirstOrDefaultAsync(ur => ur.TenantId == tenantId && ur.UserId == userId, ct);

        if (existingUserRole == null) return false;

        _db.UserRoles.Remove(existingUserRole);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
