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
        var result = await _authService.RefreshTokenAsync(request.RefreshToken);

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
        if (userId is null)
            return Unauthorized();

        var result = await _authService.GetCurrentUserAsync(userId.Value);
        return result is null ? Unauthorized() : Ok(result);
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

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue("id")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(idClaim, out var id) ? id : null;
    }
}
