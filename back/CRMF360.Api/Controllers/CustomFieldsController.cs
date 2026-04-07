using CRMF360.Application.CustomFields;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/custom-fields")]
[Authorize]
public class CustomFieldsController : ControllerBase
{
    private readonly ICustomFieldService _service;
    public CustomFieldsController(ICustomFieldService service) => _service = service;

    // ── Definitions ──
    [HttpGet("definitions")]
    public async Task<IActionResult> GetDefinitions([FromQuery] string entityType, CancellationToken ct)
        => Ok(await _service.GetDefinitionsAsync(entityType, ct));

    [HttpPost("definitions")]
    public async Task<IActionResult> CreateDefinition([FromBody] CreateCustomFieldDefinitionDto dto, CancellationToken ct)
    {
        var result = await _service.CreateDefinitionAsync(dto, ct);
        return Created($"api/custom-fields/definitions/{result.Id}", result);
    }

    [HttpPut("definitions/{id:int}")]
    public async Task<IActionResult> UpdateDefinition(int id, [FromBody] UpdateCustomFieldDefinitionDto dto, CancellationToken ct)
    {
        var result = await _service.UpdateDefinitionAsync(id, dto, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("definitions/{id:int}")]
    public async Task<IActionResult> DeleteDefinition(int id, CancellationToken ct)
        => await _service.DeleteDefinitionAsync(id, ct) ? NoContent() : NotFound();

    // ── Values ──
    [HttpGet("values")]
    public async Task<IActionResult> GetValues([FromQuery] string entityType, [FromQuery] int entityId, CancellationToken ct)
        => Ok(await _service.GetValuesAsync(entityType, entityId, ct));

    [HttpPut("values")]
    public async Task<IActionResult> SetValues(
        [FromQuery] string entityType,
        [FromQuery] int entityId,
        [FromBody] List<SetCustomFieldValueDto> values,
        CancellationToken ct)
    {
        await _service.SetValuesAsync(entityType, entityId, values, ct);
        return NoContent();
    }
}
