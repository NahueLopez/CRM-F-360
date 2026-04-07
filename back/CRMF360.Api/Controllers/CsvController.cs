using CRMF360.Application.Csv;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/csv")]
[Authorize]
public class CsvController : ControllerBase
{
    private readonly ICsvService _service;
    public CsvController(ICsvService service) => _service = service;

    [HttpGet("export/companies")]
    public async Task<IActionResult> ExportCompanies(CancellationToken ct)
        => File(await _service.ExportCompaniesAsync(ct), "text/csv", "empresas.csv");

    [HttpGet("export/contacts")]
    public async Task<IActionResult> ExportContacts(CancellationToken ct)
        => File(await _service.ExportContactsAsync(ct), "text/csv", "contactos.csv");

    [HttpGet("export/deals")]
    public async Task<IActionResult> ExportDeals(CancellationToken ct)
        => File(await _service.ExportDealsAsync(ct), "text/csv", "oportunidades.csv");

    [HttpPost("import/companies")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> ImportCompanies(IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0) return BadRequest(new { message = "Archivo vacío" });
        using var stream = file.OpenReadStream();
        var result = await _service.ImportCompaniesAsync(stream, ct);
        return Ok(result);
    }

    [HttpPost("import/contacts")]
    [DisableRequestSizeLimit]
    public async Task<IActionResult> ImportContacts(IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0) return BadRequest(new { message = "Archivo vacío" });
        using var stream = file.OpenReadStream();
        var result = await _service.ImportContactsAsync(stream, ct);
        return Ok(result);
    }
}
