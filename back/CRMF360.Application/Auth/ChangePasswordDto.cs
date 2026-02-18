using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Auth;

public class ChangePasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = null!;

    [Required]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string NewPassword { get; set; } = null!;
}
