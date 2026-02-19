using CRMF360.Api.Extensions;
using CRMF360.Application.ProjectMembers;
using CRMF360.Application.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly IProjectMemberService _memberService;

    public TasksController(ITaskService taskService, IProjectMemberService memberService)
    {
        _taskService = taskService;
        _memberService = memberService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TaskDto>>> GetAll(CancellationToken ct)
    {
        var all = await _taskService.GetAllAsync(ct);

        if (User.IsAdmin()) return Ok(all);

        // Single query: get all project IDs where user is a member
        var userProjectIds = await _memberService.GetProjectIdsForUserAsync(User.GetUserId(), ct);
        return Ok(all.Where(t => userProjectIds.Contains(t.ProjectId)).ToList());
    }

    [HttpGet("by-project/{projectId:int}")]
    public async Task<ActionResult<List<TaskDto>>> GetByProject(int projectId, CancellationToken ct)
    {
        // Must be member or admin
        if (!User.IsAdmin())
        {
            var isMember = await _memberService.IsMemberAsync(projectId, User.GetUserId(), ct);
            if (!isMember) return Forbid();
        }
        return Ok(await _taskService.GetByProjectAsync(projectId, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _taskService.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create(CreateTaskDto body, CancellationToken ct)
    {
        // Must be member or admin
        if (!User.IsAdmin())
        {
            var isMember = await _memberService.IsMemberAsync(body.ProjectId, User.GetUserId(), ct);
            if (!isMember) return Forbid();
        }

        var dto = await _taskService.CreateAsync(body, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateTaskDto body, CancellationToken ct)
        => await _taskService.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpPatch("{id:int}/move")]
    public async Task<IActionResult> Move(int id, MoveTaskDto body, CancellationToken ct)
        => await _taskService.MoveAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _taskService.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
