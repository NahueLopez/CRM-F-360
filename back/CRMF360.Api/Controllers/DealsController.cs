using CRMF360.Api.Extensions;
using CRMF360.Application.Deals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ManagerOrAdmin")]
public class DealsController : ControllerBase
{
    private readonly IDealService _svc;
    public DealsController(IDealService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _svc.GetAllAsync(ct));

    [HttpGet("stage/{stage}")]
    public async Task<IActionResult> GetByStage(string stage, CancellationToken ct)
        => Ok(await _svc.GetByStageAsync(stage, ct));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken ct)
        => Ok(await _svc.GetSummaryAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var dto = await _svc.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDealDto body, CancellationToken ct)
    {
        var dto = await _svc.CreateAsync(User.GetUserId(), body, ct);
        return Created($"api/deals/{dto.Id}", dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateDealDto body, CancellationToken ct)
        => await _svc.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpPut("{id:int}/move")]
    public async Task<IActionResult> Move(int id, MoveDealDto body, CancellationToken ct)
        => await _svc.MoveAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _svc.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
