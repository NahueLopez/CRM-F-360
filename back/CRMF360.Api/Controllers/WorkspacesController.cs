using CRMF360.Application.Workspaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceService _service;

    public WorkspacesController(IWorkspaceService service)
    {
        _service = service;
    }

    // ── Tenants CRUD ──

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var workspaces = await _service.GetAllAsync(ct);
        return Ok(workspaces);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var workspace = await _service.GetByIdAsync(id, ct);
        return workspace == null ? NotFound() : Ok(workspace);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkspaceDto dto, CancellationToken ct)
    {
        var newWorkspace = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = newWorkspace.Id }, newWorkspace);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateWorkspaceDto dto, CancellationToken ct)
    {
        var result = await _service.UpdateAsync(id, dto, ct);
        return result == null ? NotFound() : Ok(result);
    }

    // ── Workspace Users (UserRoles bindings) ──

    [HttpGet("{id:int}/users")]
    public async Task<IActionResult> GetUsers(int id, CancellationToken ct)
    {
        var users = await _service.GetUsersAsync(id, ct);
        return Ok(users);
    }

    [HttpPost("{id:int}/users")]
    public async Task<IActionResult> AssignUser(int id, [FromBody] AssignWorkspaceUserDto dto, CancellationToken ct)
    {
        var result = await _service.AssignUserAsync(id, dto, ct);
        return result ? Ok(new { message = "User assigned successfully" }) : BadRequest(new { message = "Invalid tenant, user, or role" });
    }

    [HttpDelete("{id:int}/users/{userId:int}")]
    public async Task<IActionResult> RemoveUser(int id, int userId, CancellationToken ct)
    {
        var result = await _service.RemoveUserAsync(id, userId, ct);
        return result ? NoContent() : NotFound(new { message = "User not found in this workspace" });
    }
}
