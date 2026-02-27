namespace CRMF360.Application.Auth;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto?> GetCurrentUserAsync(int userId);
    Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto request);
    Task<string?> GetPreferencesAsync(int userId);
    Task<bool> UpdatePreferencesAsync(int userId, string preferencesJson);
}
