using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    public string Password { get; set; } = null!;
}
