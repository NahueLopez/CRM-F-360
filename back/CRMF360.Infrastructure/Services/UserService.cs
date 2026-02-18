using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CRMF360.Application.Abstractions;
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

        return MapToDto(user);
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync()
    {
        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.FullName)
            .ToListAsync();

        return users.Select(MapToDto).ToList();
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return user is null ? null : MapToDto(user);
    }

    public async Task<UserDto?> UpdateAsync(int id, UpdateUserDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return null;

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.Active = dto.Active;

        await _context.SaveChangesAsync();

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

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone,
        Active = user.Active,
        CreatedAt = user.CreatedAt,
        LastLoginAt = user.LastLoginAt
    };

    private static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);
}
