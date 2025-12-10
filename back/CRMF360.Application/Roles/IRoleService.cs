using CRMF360.Domain.Entities;

namespace CRMF360.Application.Roles;

public interface IRoleService
{
    Task<List<RoleDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<RoleDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<RoleDto> CreateAsync(CreateRoleDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(int id, UpdateRoleDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
