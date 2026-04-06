using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CRMF360.Application.Abstractions;
using CRMF360.Application.Common;
using CRMF360.Application.Users;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _context;

    public UserService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = HashPassword(dto.Password),
            Active = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign role (required)
        _context.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = dto.RoleId
        });
        await _context.SaveChangesAsync();

        return MapToDto(user);
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync()
    {
        var users = await _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .OrderBy(u => u.FullName)
            .ToListAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<PagedResult<UserDto>> GetPagedAsync(PaginationParams p, System.Threading.CancellationToken ct = default)
    {
        var query = _context.Users.AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.Search))
        {
            var pattern = $"%{p.Search}%";
            query = query.Where(u => EF.Functions.ILike(u.FullName, pattern)
                || (u.Email != null && EF.Functions.ILike(u.Email, pattern))
                || (u.Phone != null && EF.Functions.ILike(u.Phone, pattern)));
        }

        query = p.SortBy?.ToLower() switch
        {
            "name" => p.Descending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "createdat" => p.Descending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            _ => query.OrderBy(u => u.FullName),
        };

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(u => MapToDto(u))
            .ToListAsync(ct);

        return new PagedResult<UserDto>
        {
            Items = items,
            Page = p.Page,
            PageSize = p.PageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        return user is null ? null : MapToDto(user);
    }

    public async Task<UserDto?> UpdateAsync(int id, UpdateUserDto dto)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return null;

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.Active = dto.Active;

        // Update role if provided
        if (dto.RoleId.HasValue)
        {
            user.UserRoles.Clear();
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = dto.RoleId.Value
            });
        }

        await _context.SaveChangesAsync();

        // Reload with role
        await _context.Entry(user).Collection(u => u.UserRoles).Query()
            .Include(ur => ur.Role).LoadAsync();

        return MapToDto(user);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return false;

        // 🔴 Delete físico. Si preferís borrado lógico,
        // acá podríamos hacer: user.Active = false;
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return true;
    }

    private static UserDto MapToDto(User user)
    {
        var firstRole = user.UserRoles?.FirstOrDefault();
        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Active = user.Active,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            RoleId = firstRole?.RoleId,
            RoleName = firstRole?.Role?.Name,
        };
    }

    private static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);
}
