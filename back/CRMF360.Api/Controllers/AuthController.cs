using CRMF360.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result is null)
            return Unauthorized(new { message = "Usuario o contraseña incorrectos" });

        return Ok(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto request)
    {
        var tenantId = GetCurrentTenantId();
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, tenantId);

        if (result is null)
            return Unauthorized(new { message = "Refresh token inválido o expirado" });

        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Me()
    {
        var userId = GetCurrentUserId();
        var tenantId = GetCurrentTenantId();
        
        if (userId is null)
            return Unauthorized();

        var result = await _authService.GetCurrentUserAsync(userId.Value, tenantId);
        return result is null ? Unauthorized() : Ok(result);
    }
    
    [HttpPost("switch-workspace")]
    [Authorize]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SwitchWorkspace([FromBody] SwitchWorkspaceRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();
        
        var result = await _authService.SwitchWorkspaceAsync(userId.Value, request.TenantId);
        if (result is null) return Unauthorized(new { message = "No perteneces a este workspace" });
        
        return Ok(result);
    }

    [HttpPut("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
            return Unauthorized();

        var success = await _authService.ChangePasswordAsync(userId.Value, request);
        if (!success)
            return BadRequest(new { message = "Contraseña actual incorrecta" });

        return NoContent();
    }

    [HttpGet("preferences")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPreferences()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var prefs = await _authService.GetPreferencesAsync(userId.Value);
        return Ok(new { preferences = prefs });
    }

    [HttpPut("preferences")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        await _authService.UpdatePreferencesAsync(userId.Value, request.Preferences);
        return NoContent();
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue("id")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(idClaim, out var id) ? id : null;
    }
    
    private int? GetCurrentTenantId()
    {
        var tenantIdClaim = User.FindFirstValue("tenantId");
        return int.TryParse(tenantIdClaim, out var tenantId) ? tenantId : null;
    }
}

public class UpdatePreferencesRequest
{
    public string Preferences { get; set; } = null!;
}

public class SwitchWorkspaceRequest
{
    public int TenantId { get; set; }
}
