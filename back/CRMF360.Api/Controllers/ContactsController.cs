using CRMF360.Application.Common;
using CRMF360.Application.Contacts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ManagerOrAdmin")]
public class ContactsController : ControllerBase
{
    private readonly IContactService _service;
    public ContactsController(IContactService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<ContactDto>>> GetAll(CancellationToken ct)
        => Ok(await _service.GetAllAsync(ct));

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<ContactDto>>> GetPaged(
        [FromQuery] PaginationParams p, CancellationToken ct)
        => Ok(await _service.GetPagedAsync(p, ct));

    [HttpGet("by-company/{companyId:int}")]
    public async Task<ActionResult<List<ContactDto>>> GetByCompany(int companyId, CancellationToken ct)
        => Ok(await _service.GetByCompanyAsync(companyId, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ContactDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _service.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<ContactDto>> Create(CreateContactDto body, CancellationToken ct)
    {
        var dto = await _service.CreateAsync(body, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateContactDto body, CancellationToken ct)
        => await _service.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
