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
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _context;
    private readonly int? _currentTenantId;

    public UserService(IApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        var tenantClaim = httpContextAccessor.HttpContext?.User?.FindFirst("tenantId")?.Value;
        _currentTenantId = int.TryParse(tenantClaim, out var tid) ? tid : null;
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        // Check if user with email already exists globally
        var existingUser = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        User user;
        if (existingUser != null)
        {
            // User exists globally — just add a role in the current tenant
            user = existingUser;
        }
        else
        {
            // Create new global user
            user = new User
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
        }

        // Assign role in the current tenant (if we have one)
        if (_currentTenantId.HasValue)
        {
            var existing = await _context.UserRoles.IgnoreQueryFilters()
                .AnyAsync(ur => ur.UserId == user.Id && ur.TenantId == _currentTenantId.Value);

            if (!existing)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = dto.RoleId,
                    TenantId = _currentTenantId.Value
                });
                await _context.SaveChangesAsync();
            }
        }

        return MapToDto(user);
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync()
    {
        IQueryable<User> query = _context.Users.IgnoreQueryFilters()
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role);

        // Scope to current tenant: only users that have a UserRole in this tenant
        if (_currentTenantId.HasValue)
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.TenantId == _currentTenantId.Value));
        }

        var users = await query.OrderBy(u => u.FullName).ToListAsync();
        return users.Select(MapToDto).ToList();
    }

    public async Task<PagedResult<UserDto>> GetPagedAsync(PaginationParams p, System.Threading.CancellationToken ct = default)
    {
        IQueryable<User> query = _context.Users.IgnoreQueryFilters()
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role);

        // Scope to current tenant
        if (_currentTenantId.HasValue)
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.TenantId == _currentTenantId.Value));
        }

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
        var user = await _context.Users.IgnoreQueryFilters()
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return null;

        // Verify user belongs to current tenant (if scoped)
        if (_currentTenantId.HasValue && !user.UserRoles.Any(ur => ur.TenantId == _currentTenantId.Value))
            return null;

        return MapToDto(user);
    }

    public async Task<UserDto?> UpdateAsync(int id, UpdateUserDto dto)
    {
        var user = await _context.Users.IgnoreQueryFilters()
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return null;

        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.Phone = dto.Phone;
        user.Active = dto.Active;

        // Update role ONLY for the current tenant — don't touch other tenants
        if (dto.RoleId.HasValue && _currentTenantId.HasValue)
        {
            var tenantRole = user.UserRoles.FirstOrDefault(ur => ur.TenantId == _currentTenantId.Value);
            if (tenantRole != null)
            {
                tenantRole.RoleId = dto.RoleId.Value;
            }
            else
            {
                // User not yet in this tenant — add them
                user.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = dto.RoleId.Value,
                    TenantId = _currentTenantId.Value
                });
            }
        }

        await _context.SaveChangesAsync();

        // Re-query
        var updated = await _context.Users.IgnoreQueryFilters().AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == id);

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        // In a multi-tenant context: unlink from current tenant, don't delete the user globally
        if (_currentTenantId.HasValue)
        {
            var userRole = await _context.UserRoles.IgnoreQueryFilters()
                .FirstOrDefaultAsync(ur => ur.UserId == id && ur.TenantId == _currentTenantId.Value);

            if (userRole is null) return false;

            _context.UserRoles.Remove(userRole);
            await _context.SaveChangesAsync();
            return true;
        }

        // No tenant context (SuperAdmin global delete)
        var user = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    private UserDto MapToDto(User user)
    {
        // Get the role for the current tenant only
        UserRole? relevantRole = _currentTenantId.HasValue
            ? user.UserRoles?.FirstOrDefault(ur => ur.TenantId == _currentTenantId.Value)
            : user.UserRoles?.FirstOrDefault();

        return new UserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Active = user.Active,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            RoleId = relevantRole?.RoleId,
            RoleName = relevantRole?.Role?.Name,
        };
    }

    private static string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);
}
