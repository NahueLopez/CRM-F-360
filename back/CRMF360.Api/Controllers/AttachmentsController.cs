using CRMF360.Api.Extensions;
using CRMF360.Application.Attachments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly IAttachmentService _service;
    public AttachmentsController(IAttachmentService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetByEntity([FromQuery] string entityType, [FromQuery] int entityId, CancellationToken ct)
        => Ok(await _service.GetByEntityAsync(entityType, entityId, ct));

    [HttpPost]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> Upload(
        [FromQuery] string entityType,
        [FromQuery] int entityId,
        IFormFile file,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0) return BadRequest(new { message = "Archivo vacío" });
        var userId = User.GetUserId();
        using var stream = file.OpenReadStream();
        var result = await _service.UploadAsync(entityType, entityId, userId, file.FileName, file.ContentType, stream, ct);
        return Created($"api/attachments/{result.Id}", result);
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id, CancellationToken ct)
    {
        var result = await _service.DownloadAsync(id, ct);
        if (result is null) return NotFound();
        return File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
