using CRMF360.Api.Extensions;
using CRMF360.Application.ProjectMembers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/members")]
[Authorize]
public class ProjectMembersController : ControllerBase
{
    private readonly IProjectMemberService _service;

    public ProjectMembersController(IProjectMemberService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetByProject(int projectId, CancellationToken ct)
    {
        // Must be member or admin
        if (!User.IsAdmin())
        {
            var isMember = await _service.IsMemberAsync(projectId, User.GetUserId(), ct);
            if (!isMember) return Forbid();
        }
        var members = await _service.GetByProjectAsync(projectId, ct);
        return Ok(members);
    }

    [HttpPost]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<IActionResult> AddMember(int projectId, [FromBody] AddProjectMemberDto dto, CancellationToken ct)
    {
        var result = await _service.AddMemberAsync(projectId, dto, ct);
        if (result is null) return Conflict(new { message = "El usuario ya es miembro de este proyecto" });
        return Created($"api/projects/{projectId}/members/{result.UserId}", result);
    }

    [HttpPut("{userId}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<IActionResult> UpdateRole(int projectId, int userId, [FromBody] UpdateProjectMemberDto dto, CancellationToken ct)
    {
        var ok = await _service.UpdateRoleAsync(projectId, userId, dto, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{userId}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<IActionResult> RemoveMember(int projectId, int userId, CancellationToken ct)
    {
        var ok = await _service.RemoveMemberAsync(projectId, userId, ct);
        return ok ? NoContent() : NotFound();
    }
}
