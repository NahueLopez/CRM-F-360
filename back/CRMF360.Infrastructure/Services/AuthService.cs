using CRMF360.Application.Abstractions;
using CRMF360.Application.Auth;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CRMF360.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthService(IApplicationDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _db.Users.IgnoreQueryFilters()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Tenant)
            .FirstOrDefaultAsync(u =>
                u.Email == request.Email &&
                u.Active);

        if (user == null)
            return null;

        bool passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!passwordOk)
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var currentTenantId = user.UserRoles.FirstOrDefault()?.TenantId;
        var token = GenerateJwtToken(user, currentTenantId);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        return MapToResponse(user, token, refreshToken, currentTenantId);
    }

    public async Task<LoginResponseDto?> GetCurrentUserAsync(int userId, int? currentTenantId)
    {
        var user = await _db.Users.IgnoreQueryFilters()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active);

        if (user == null)
            return null;

        var token = GenerateJwtToken(user, currentTenantId);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        return MapToResponse(user, token, refreshToken, currentTenantId);
    }
    
    public async Task<LoginResponseDto?> SwitchWorkspaceAsync(int userId, int tenantId)
    {
        var user = await _db.Users.IgnoreQueryFilters()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active);

        if (user == null || !user.UserRoles.Any(ur => ur.TenantId == tenantId))
            return null;

        var token = GenerateJwtToken(user, tenantId);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        return MapToResponse(user, token, refreshToken, tenantId);
    }

    public async Task<LoginResponseDto?> RefreshTokenAsync(string refreshTokenValue, int? currentTenantId)
    {
        var storedToken = await _db.RefreshTokens.IgnoreQueryFilters()
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                        .ThenInclude(r => r.RolePermissions)
                            .ThenInclude(rp => rp.Permission)
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Tenant)
            .FirstOrDefaultAsync(rt => rt.Token == refreshTokenValue);

        if (storedToken == null || !storedToken.IsActive)
            return null;

        var user = storedToken.User;
        if (!user.Active)
            return null;

        storedToken.RevokedAt = DateTime.UtcNow;

        var newJwt = GenerateJwtToken(user, currentTenantId);
        var newRefreshToken = await CreateRefreshTokenAsync(user.Id);

        return MapToResponse(user, newJwt, newRefreshToken, currentTenantId);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active);
        if (user == null) return false;
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash)) return false;
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<string?> GetPreferencesAsync(int userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Active);
        return user?.Preferences;
    }

    public async Task<bool> UpdatePreferencesAsync(int userId, string preferencesJson)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId && u.Active);
        if (user == null) return false;
        user.Preferences = preferencesJson;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string> CreateRefreshTokenAsync(int userId)
    {
        var expireDays = int.TryParse(_configuration["Jwt:RefreshExpireDays"], out var d) ? d : 7;
        var token = new RefreshToken
        {
            UserId = userId,
            Token = GenerateSecureToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(expireDays),
            CreatedAt = DateTime.UtcNow
        };
        _db.RefreshTokens.Add(token);
        await _db.SaveChangesAsync();
        return token.Token;
    }

    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private static LoginResponseDto MapToResponse(User user, string token, string refreshToken, int? currentTenantId)
    {
        var currentTenant = user.UserRoles.FirstOrDefault(ur => ur.TenantId == currentTenantId)?.Tenant;
        
        return new LoginResponseDto
        {
            Id = user.Id,
            TenantId = currentTenantId,
            TenantName = currentTenant?.Name,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Token = token,
            RefreshToken = refreshToken,
            Roles = user.UserRoles
                .Where(ur => ur.TenantId == currentTenantId && ur.Role != null)
                .Select(ur => ur.Role.Name)
                .ToList(),
            Preferences = user.Preferences,
            Permissions = user.UserRoles
                .Where(ur => ur.TenantId == currentTenantId && ur.Role != null)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Where(rp => rp.Permission != null)
                .Select(rp => rp.Permission.Name)
                .Distinct()
                .ToList(),
            AvailableWorkspaces = user.UserRoles
                .Where(ur => ur.Tenant != null)
                .Select(ur => new WorkspaceDto { Id = ur.TenantId, Name = ur.Tenant.Name })
                .DistinctBy(w => w.Id)
                .ToList()
        };
    }

    private string GenerateJwtToken(User user, int? currentTenantId)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "CRMF360";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "CRMF360-BackOffice";
        var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var m) ? m : 30;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName),
            new Claim("id", user.Id.ToString())
        };

        if (currentTenantId.HasValue)
        {
            claims.Add(new Claim("tenantId", currentTenantId.Value.ToString()));
            
            var roles = user.UserRoles
                .Where(ur => ur.TenantId == currentTenantId.Value && ur.Role != null)
                .Select(ur => ur.Role.Name)
                .Distinct();
                
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
