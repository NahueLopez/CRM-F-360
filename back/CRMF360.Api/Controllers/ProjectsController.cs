using CRMF360.Api.Extensions;
using CRMF360.Application.ProjectMembers;
using CRMF360.Application.Projects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IProjectMemberService _memberService;

    public ProjectsController(IProjectService projectService, IProjectMemberService memberService)
    {
        _projectService = projectService;
        _memberService = memberService;
    }

    [HttpGet]
    [Authorize(Policy = "projects.view")]
    public async Task<ActionResult<List<ProjectDto>>> GetAll(CancellationToken ct)
    {
        var all = await _projectService.GetAllAsync(ct);

        // Admin/Manager see all, regular users only see their projects
        if (User.IsAdmin())
            return Ok(all);

        var userProjectIds = await _memberService.GetProjectIdsForUserAsync(User.GetUserId(), ct);
        return Ok(all.Where(p => userProjectIds.Contains(p.Id)).ToList());
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "projects.view")]
    public async Task<ActionResult<ProjectDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _projectService.GetByIdAsync(id, ct);
        if (dto is null) return NotFound();

        // Non-admin must be a member
        if (!User.IsAdmin())
        {
            var isMember = await _memberService.IsMemberAsync(id, User.GetUserId(), ct);
            if (!isMember) return Forbid();
        }

        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Policy = "projects.create")]
    public async Task<ActionResult<ProjectDto>> Create(CreateProjectDto body, CancellationToken ct)
    {
        var dto = await _projectService.CreateAsync(body, ct);

        // Auto-add creator as Lead
        await _memberService.AddMemberAsync(dto.Id, new AddProjectMemberDto
        {
            UserId = User.GetUserId(),
            Role = "Lead"
        }, ct);

        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProjectDto body, CancellationToken ct)
    {
        // Must be Admin or Lead of the project
        if (!User.IsAdmin())
        {
            var members = await _memberService.GetByProjectAsync(id, ct);
            var me = members.FirstOrDefault(m => m.UserId == User.GetUserId());
            if (me is null || me.Role != "Lead") return Forbid();
        }

        return await _projectService.UpdateAsync(id, body, ct) ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "projects.delete")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _projectService.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
