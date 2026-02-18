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
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RoleDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<RoleDto> CreateAsync(CreateRoleDto dto, CancellationToken cancellationToken = default)
    {
        // Validación simple de nombre único (opcional, pero útil)
        var exists = await _context.Roles
            .AnyAsync(r => r.Name == dto.Name, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Ya existe un rol con el nombre '{dto.Name}'.");
        }

        var entity = new Role
        {
            Name = dto.Name,
        };

        _context.Roles.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return new RoleDto
        {
            Id = entity.Id,
            Name = entity.Name,
        };
    }

    public async Task<bool> UpdateAsync(int id, UpdateRoleDto dto, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Roles
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (entity == null)
            return false;

        // Validar nombre único (que no choque con otro rol)
        var exists = await _context.Roles
            .AnyAsync(r => r.Id != id && r.Name == dto.Name, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"Ya existe otro rol con el nombre '{dto.Name}'.");
        }

        entity.Name = dto.Name;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.Roles
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (entity == null)
            return false;

        _context.Roles.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
