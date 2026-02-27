using CRMF360.Application.Abstractions;
using CRMF360.Application.Roles;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class RoleService : IRoleService
{
    private readonly IApplicationDbContext _context;

    public RoleService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<RoleDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Permissions = r.RolePermissions
                    .Select(rp => rp.Permission.Name)
                    .ToList()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RoleDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Where(r => r.Id == id)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Permissions = r.RolePermissions
                    .Select(rp => rp.Permission.Name)
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<RoleDto> CreateAsync(CreateRoleDto dto, CancellationToken cancellationToken = default)
    {
        var exists = await _context.Roles
            .AnyAsync(r => r.Name == dto.Name, cancellationToken);

        if (exists)
            throw new InvalidOperationException($"Ya existe un rol con el nombre '{dto.Name}'.");

        var entity = new Role { Name = dto.Name };
        _context.Roles.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return new RoleDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Permissions = new()
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateRoleDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (entity == null) return false;

        // Validate unique name
        var exists = await _context.Roles
            .AnyAsync(r => r.Id != id && r.Name == dto.Name, cancellationToken);

        if (exists)
            throw new InvalidOperationException($"Ya existe otro rol con el nombre '{dto.Name}'.");

        entity.Name = dto.Name;

        // Update permissions if provided
        if (dto.PermissionIds != null)
        {
            // Remove old permissions
            entity.RolePermissions.Clear();

            // Add new ones
            foreach (var permId in dto.PermissionIds)
            {
                entity.RolePermissions.Add(new RolePermission
                {
                    RoleId = id,
                    PermissionId = permId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Roles
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (entity == null) return false;

        _context.Roles.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
