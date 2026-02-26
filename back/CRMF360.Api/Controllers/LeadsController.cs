using CRMF360.Api.Extensions;
using CRMF360.Application.Common;
using CRMF360.Application.Leads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _service;
    public LeadsController(ILeadService service) => _service = service;

    [HttpGet]
    [Authorize(Policy = "deals.view")]
    public async Task<ActionResult<PagedResult<LeadDto>>> GetPaged(
        [FromQuery] PaginationParams p, CancellationToken ct)
        => Ok(await _service.GetPagedAsync(p, ct));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "deals.view")]
    public async Task<ActionResult<LeadDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    [Authorize(Policy = "deals.create")]
    public async Task<ActionResult<LeadDto>> Create(CreateLeadDto body, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var dto = await _service.CreateAsync(userId, body, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "deals.edit")]
    public async Task<IActionResult> Update(int id, UpdateLeadDto body, CancellationToken ct)
        => await _service.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "deals.delete")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();

    [HttpPost("{id:int}/convert")]
    [Authorize(Policy = "deals.create")]
    public async Task<ActionResult<LeadDto>> Convert(int id, ConvertLeadDto body, CancellationToken ct)
    {
        var result = await _service.ConvertAsync(id, body, ct);
        return result is null ? NotFound() : Ok(result);
    }
}
