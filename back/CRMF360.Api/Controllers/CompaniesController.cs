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
}
