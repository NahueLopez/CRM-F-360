using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using CRMF360.Application.Common;

namespace CRMF360.Application.Users;

public interface IUserService
{
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<IReadOnlyList<UserDto>> GetAllAsync();
    Task<PagedResult<UserDto>> GetPagedAsync(PaginationParams p, CancellationToken ct = default);
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto?> UpdateAsync(int id, UpdateUserDto dto);
    Task<bool> DeleteAsync(int id);
}
