using CRMF360.Application.Projects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "ManagerOrAdmin")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
        => _projectService = projectService;

    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> GetAll(CancellationToken ct)
        => Ok(await _projectService.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _projectService.GetByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create(CreateProjectDto body, CancellationToken ct)
    {
        var dto = await _projectService.CreateAsync(body, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProjectDto body, CancellationToken ct)
        => await _projectService.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _projectService.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
