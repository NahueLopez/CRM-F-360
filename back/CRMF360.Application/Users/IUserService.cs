using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRMF360.Application.Users;

public interface IUserService
{
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<IReadOnlyList<UserDto>> GetAllAsync();
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto?> UpdateAsync(int id, UpdateUserDto dto);
    Task<bool> DeleteAsync(int id);
}
