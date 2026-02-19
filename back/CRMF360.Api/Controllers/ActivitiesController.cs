using CRMF360.Api.Extensions;
using CRMF360.Application.Activities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _service;
    public ActivitiesController(IActivityService service) => _service = service;

    [HttpGet("by-company/{companyId:int}")]
    public async Task<IActionResult> GetByCompany(int companyId, CancellationToken ct)
        => Ok(await _service.GetByCompanyAsync(companyId, ct));

    [HttpGet("by-contact/{contactId:int}")]
    public async Task<IActionResult> GetByContact(int contactId, CancellationToken ct)
        => Ok(await _service.GetByContactAsync(contactId, ct));

    [HttpGet("by-project/{projectId:int}")]
    public async Task<IActionResult> GetByProject(int projectId, CancellationToken ct)
        => Ok(await _service.GetByProjectAsync(projectId, ct));

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent([FromQuery] int count = 20, CancellationToken ct = default)
        => Ok(await _service.GetRecentAsync(count, ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateActivityDto body, CancellationToken ct)
    {
        body.UserId = User.GetUserId();
        var dto = await _service.CreateAsync(body, ct);
        return Created($"api/activities/{dto.Id}", dto);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
