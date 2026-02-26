using CRMF360.Application.Common;
using CRMF360.Application.Companies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ManagerOrAdmin")]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyService _companyService;

    public CompaniesController(ICompanyService companyService)
        => _companyService = companyService;

    [HttpGet]
    public async Task<ActionResult<List<CompanyDto>>> GetAll(CancellationToken ct)
        => Ok(await _companyService.GetAllAsync(ct));

    [HttpGet("paged")]
    public async Task<ActionResult<PagedResult<CompanyDto>>> GetPaged(
        [FromQuery] PaginationParams p, CancellationToken ct)
        => Ok(await _companyService.GetPagedAsync(p, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CompanyDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _companyService.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDto>> Create(CreateCompanyDto body, CancellationToken ct)
    {
        var dto = await _companyService.CreateAsync(body, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateCompanyDto body, CancellationToken ct)
        => await _companyService.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _companyService.DeleteAsync(id, ct) ? NoContent() : NotFound();

    [HttpGet("export")]
    [Authorize(Policy = "ManagerOrAdmin")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        var companies = await _companyService.GetAllAsync(ct);
        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Id,Name,CUIT,Email,Phone,Active,CreatedAt");
        foreach (var c in companies)
        {
            csv.AppendLine($"{c.Id},\"{Escape(c.Name)}\",\"{Escape(c.Cuit)}\",\"{Escape(c.Email)}\",\"{Escape(c.Phone)}\",{c.Active},{c.CreatedAt:yyyy-MM-dd}");
        }
        var bytes = System.Text.Encoding.UTF8.GetBytes(csv.ToString());
        return File(bytes, "text/csv", $"companies_{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    private static string Escape(string? s) => s?.Replace("\"", "\"\"") ?? "";
}
