namespace CRMF360.Application.Auth;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto?> GetCurrentUserAsync(int userId);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto request);
}
