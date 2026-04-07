using CRMF360.Application.Tags;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TagsController : ControllerBase
{
    private readonly ITagService _service;
    public TagsController(ITagService service) => _service = service;

    // ── CRUD ──
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await _service.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTagDto dto, CancellationToken ct)
    {
        var result = await _service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTagDto dto, CancellationToken ct)
    {
        var result = await _service.UpdateAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();

    // ── Company Tags ──
    [HttpGet("by-company/{companyId:int}")]
    public async Task<IActionResult> GetByCompany(int companyId, CancellationToken ct)
        => Ok(await _service.GetByCompanyAsync(companyId, ct));

    [HttpPost("company/{companyId:int}")]
    public async Task<IActionResult> AssignToCompany(int companyId, [FromBody] AssignTagDto dto, CancellationToken ct)
    {
        await _service.AssignToCompanyAsync(companyId, dto.TagId, ct);
        return NoContent();
    }

    [HttpDelete("company/{companyId:int}/{tagId:int}")]
    public async Task<IActionResult> UnassignFromCompany(int companyId, int tagId, CancellationToken ct)
        => await _service.UnassignFromCompanyAsync(companyId, tagId, ct) ? NoContent() : NotFound();

    // ── Contact Tags ──
    [HttpGet("by-contact/{contactId:int}")]
    public async Task<IActionResult> GetByContact(int contactId, CancellationToken ct)
        => Ok(await _service.GetByContactAsync(contactId, ct));

    [HttpPost("contact/{contactId:int}")]
    public async Task<IActionResult> AssignToContact(int contactId, [FromBody] AssignTagDto dto, CancellationToken ct)
    {
        await _service.AssignToContactAsync(contactId, dto.TagId, ct);
        return NoContent();
    }

    [HttpDelete("contact/{contactId:int}/{tagId:int}")]
    public async Task<IActionResult> UnassignFromContact(int contactId, int tagId, CancellationToken ct)
        => await _service.UnassignFromContactAsync(contactId, tagId, ct) ? NoContent() : NotFound();

    // ── Deal Tags ──
    [HttpGet("by-deal/{dealId:int}")]
    public async Task<IActionResult> GetByDeal(int dealId, CancellationToken ct)
        => Ok(await _service.GetByDealAsync(dealId, ct));

    [HttpPost("deal/{dealId:int}")]
    public async Task<IActionResult> AssignToDeal(int dealId, [FromBody] AssignTagDto dto, CancellationToken ct)
    {
        await _service.AssignToDealAsync(dealId, dto.TagId, ct);
        return NoContent();
    }

    [HttpDelete("deal/{dealId:int}/{tagId:int}")]
    public async Task<IActionResult> UnassignFromDeal(int dealId, int tagId, CancellationToken ct)
        => await _service.UnassignFromDealAsync(dealId, tagId, ct) ? NoContent() : NotFound();
}
