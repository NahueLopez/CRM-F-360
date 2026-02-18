using CRMF360.Application.Roles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    // GET: api/roles
    [HttpGet]
    public async Task<ActionResult<List<RoleDto>>> GetAll(CancellationToken cancellationToken)
    {
        var roles = await _roleService.GetAllAsync(cancellationToken);
        return Ok(roles);
    }

    // GET: api/roles/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RoleDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var role = await _roleService.GetByIdAsync(id, cancellationToken);
        if (role == null) return NotFound();

        return Ok(role);
    }

    // POST: api/roles
    [HttpPost]
    public async Task<ActionResult<RoleDto>> Create([FromBody] CreateRoleDto dto, CancellationToken cancellationToken)
    {
        var created = await _roleService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    // PUT: api/roles/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoleDto dto, CancellationToken cancellationToken)
    {
        var ok = await _roleService.UpdateAsync(id, dto, cancellationToken);
        if (!ok) return NotFound();

        return NoContent();
    }

    // DELETE: api/roles/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var ok = await _roleService.DeleteAsync(id, cancellationToken);
        if (!ok) return NotFound();

        return NoContent();
    }
}
