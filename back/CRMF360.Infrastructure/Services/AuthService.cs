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
            .Include(u => u.Tenant)
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

        var token = GenerateJwtToken(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        return MapToResponse(user, token, refreshToken);
    }

    public async Task<LoginResponseDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active);

        if (user == null)
            return null;

        var token = GenerateJwtToken(user);
        var refreshToken = await CreateRefreshTokenAsync(user.Id);

        return MapToResponse(user, token, refreshToken);
    }

    public async Task<LoginResponseDto?> RefreshTokenAsync(string refreshTokenValue)
    {
        var storedToken = await _db.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .Include(rt => rt.User)
                .ThenInclude(u => u.Tenant)
            .FirstOrDefaultAsync(rt => rt.Token == refreshTokenValue);

        if (storedToken == null || !storedToken.IsActive)
            return null;

        var user = storedToken.User;
        if (!user.Active)
            return null;

        // Revoke the old refresh token (rotation)
        storedToken.RevokedAt = DateTime.UtcNow;

        // Generate new tokens
        var newJwt = GenerateJwtToken(user);
        var newRefreshToken = await CreateRefreshTokenAsync(user.Id);

        return MapToResponse(user, newJwt, newRefreshToken);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active);

        if (user == null)
            return false;

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _db.SaveChangesAsync();

        return true;
    }

    // ── Private helpers ─────────────────────────────────────

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

    private static LoginResponseDto MapToResponse(User user, string token, string refreshToken) => new()
    {
        Id = user.Id,
        TenantId = user.TenantId,
        TenantName = user.Tenant?.Name ?? "Default",
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone,
        Token = token,
        RefreshToken = refreshToken,
        Roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role.Name)
            .ToList()
    };

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key not configured");
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
            new Claim("id", user.Id.ToString()),
            new Claim("tenantId", user.TenantId.ToString())
        };

        foreach (var ur in user.UserRoles)
        {
            if (ur.Role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, ur.Role.Name));
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
