using CRMF360.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IApplicationDbContext _db;

    public PermissionsController(IApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns all available permissions grouped by module.
    /// Used by the Roles & Permissions management page.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PermissionDto>>> GetAll(CancellationToken ct)
    {
        var permissions = await _db.Permissions
            .AsNoTracking()
            .OrderBy(p => p.Module)
            .ThenBy(p => p.Name)
            .Select(p => new PermissionDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Module = p.Module
            })
            .ToListAsync(ct);

        return Ok(permissions);
    }
}

public class PermissionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Module { get; set; } = null!;
}
