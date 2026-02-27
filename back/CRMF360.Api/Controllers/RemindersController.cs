using CRMF360.Api.Extensions;
using CRMF360.Application.Reminders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RemindersController : ControllerBase
{
    private readonly IReminderService _svc;
    public RemindersController(IReminderService svc) => _svc = svc;

    [HttpGet]
    [Authorize(Policy = "reminders.view")]
    public async Task<IActionResult> GetMine(CancellationToken ct)
        => Ok(await _svc.GetByUserAsync(User.GetUserId(), ct));

    [HttpGet("pending")]
    [Authorize(Policy = "reminders.view")]
    public async Task<IActionResult> GetPending(CancellationToken ct)
        => Ok(await _svc.GetPendingAsync(User.GetUserId(), ct));

    [HttpGet("overdue")]
    [Authorize(Policy = "reminders.view")]
    public async Task<IActionResult> GetOverdue(CancellationToken ct)
        => Ok(await _svc.GetOverdueAsync(User.GetUserId(), ct));

    [HttpPost]
    [Authorize(Policy = "reminders.create")]
    public async Task<IActionResult> Create(CreateReminderDto body, CancellationToken ct)
    {
        var dto = await _svc.CreateAsync(User.GetUserId(), body, ct);
        return Created($"api/reminders/{dto.Id}", dto);
    }

    [HttpPut("{id:int}/toggle")]
    [Authorize(Policy = "reminders.edit")]
    public async Task<IActionResult> Toggle(int id, CancellationToken ct)
        => await _svc.ToggleCompleteAsync(id, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "reminders.delete")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _svc.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
