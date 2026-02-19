using CRMF360.Api.Extensions;
using CRMF360.Application.ProjectMembers;
using CRMF360.Application.TimeEntries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/time-entries")]
[Authorize]
public class TimeEntriesController : ControllerBase
{
    private readonly ITimeEntryService _timeEntryService;
    private readonly IProjectMemberService _memberService;

    public TimeEntriesController(ITimeEntryService timeEntryService, IProjectMemberService memberService)
    {
        _timeEntryService = timeEntryService;
        _memberService = memberService;
    }

    /// <summary>All time entries — Admins/Managers see all, regular users see only their own.</summary>
    [HttpGet]
    public async Task<ActionResult<List<TimeEntryDto>>> GetAll(CancellationToken ct)
    {
        if (User.IsManagerOrAdmin())
            return Ok(await _timeEntryService.GetAllAsync(ct));

        return Ok(await _timeEntryService.GetByUserAsync(User.GetUserId(), ct));
    }

    [HttpGet("by-task/{taskId:int}")]
    public async Task<ActionResult<List<TimeEntryDto>>> GetByTask(int taskId, CancellationToken ct)
        => Ok(await _timeEntryService.GetByTaskAsync(taskId, ct));

    [HttpGet("by-user/{userId:int}")]
    public async Task<ActionResult<List<TimeEntryDto>>> GetByUser(int userId, CancellationToken ct)
    {
        // Regular users can only see their own hours
        if (!User.IsManagerOrAdmin() && userId != User.GetUserId())
            return Forbid();

        return Ok(await _timeEntryService.GetByUserAsync(userId, ct));
    }

    /// <summary>Project hours summary: estimated vs logged — Managers/Admins only.</summary>
    [HttpGet("project-summary")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<IActionResult> GetProjectSummary(CancellationToken ct)
        => Ok(await _timeEntryService.GetProjectHoursSummaryAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TimeEntryDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _timeEntryService.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>Any authenticated user can log hours (always for themselves).</summary>
    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> Create(CreateTimeEntryDto body, CancellationToken ct)
    {
        // Force userId to the current user — no impersonation unless admin
        if (!User.IsAdmin())
            body.UserId = User.GetUserId();

        var dto = await _timeEntryService.CreateAsync(body, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateTimeEntryDto body, CancellationToken ct)
        => await _timeEntryService.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _timeEntryService.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
