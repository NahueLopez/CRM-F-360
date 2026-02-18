using CRMF360.Application.TimeEntries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeEntriesController : ControllerBase
{
    private readonly ITimeEntryService _timeEntryService;

    public TimeEntriesController(ITimeEntryService timeEntryService)
        => _timeEntryService = timeEntryService;

    [HttpGet]
    public async Task<ActionResult<List<TimeEntryDto>>> GetAll(CancellationToken ct)
        => Ok(await _timeEntryService.GetAllAsync(ct));

    [HttpGet("by-task/{taskId:int}")]
    public async Task<ActionResult<List<TimeEntryDto>>> GetByTask(int taskId, CancellationToken ct)
        => Ok(await _timeEntryService.GetByTaskAsync(taskId, ct));

    [HttpGet("by-user/{userId:int}")]
    public async Task<ActionResult<List<TimeEntryDto>>> GetByUser(int userId, CancellationToken ct)
        => Ok(await _timeEntryService.GetByUserAsync(userId, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TimeEntryDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _timeEntryService.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> Create(CreateTimeEntryDto body, CancellationToken ct)
    {
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
