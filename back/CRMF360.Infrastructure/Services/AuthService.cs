using CRMF360.Application.Auth;
using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CRMF360.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u =>
                u.Email == request.Email &&
                u.Active);

        if (user == null)
            return null;

        bool passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!passwordOk)
            return null;

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return MapToResponse(user, token);
    }

    public async Task<LoginResponseDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active);

        if (user == null)
            return null;

        var token = GenerateJwtToken(user);
        return MapToResponse(user, token);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.Active);

        if (user == null)
            return false;

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return true;
    }

    private static LoginResponseDto MapToResponse(User user, string token) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Phone = user.Phone,
        Token = token,
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
        var jwtAudience = _configuration["Jwt:Audience"] ?? "CRMF360-Clients";
        var expiresMinutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out var m) ? m : 60;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName),
            new Claim("id", user.Id.ToString())
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
