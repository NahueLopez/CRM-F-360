using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/users")]
//[Authorize(Roles = "Admin")]  // 👈 cuando tengas bien armado el login de Admin, lo activás
public class UserRolesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UserRolesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Asigna un rol a un usuario (por nombre de rol).
    /// </summary>
    [HttpPost("{userId:int}/roles/{roleId:int}")]
    public async Task<IActionResult> AddRoleToUser(int userId, int roleId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == roleId);
        if (role == null)
            return NotFound(new { message = $"Rol con id '{roleId}' no existe" });

        var alreadyHasRole = user.UserRoles.Any(ur => ur.RoleId == role.Id);
        if (alreadyHasRole)
            return Conflict(new { message = $"El usuario ya tiene el rol '{role.Name}'" });

        var userRole = new UserRole
        {
            UserId = user.Id,
            RoleId = role.Id
        };

        _context.UserRoles.Add(userRole);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Rol '{role.Name}' asignado al usuario {user.Email}",
            userId = user.Id,
            role = role.Name
        });
    }


    /// <summary>
    /// Quita un rol a un usuario (por nombre de rol).
    /// </summary>
    [HttpDelete("{userId:int}/roles/{roleId:int}")]
    public async Task<IActionResult> RemoveRoleFromUser(int userId, int roleId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        var userRole = user.UserRoles.FirstOrDefault(ur => ur.RoleId == roleId);
        if (userRole == null)
            return NotFound(new { message = $"El usuario no tiene el rol con id '{roleId}'" });

        _context.UserRoles.Remove(userRole);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Rol con id '{roleId}' quitado del usuario {user.Email}",
            userId = user.Id,
            roleId
        });
    }

    /// <summary>
    /// Lista los roles de un usuario.
    /// </summary>
    [HttpGet("{userId:int}/roles")]
    public async Task<IActionResult> GetUserRoles(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        var roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role!.Name)
            .ToList();

        return Ok(new
        {
            userId = user.Id,
            user.Email,
            roles
        });
    }
}
