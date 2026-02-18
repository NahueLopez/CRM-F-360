using CRMF360.Application.BoardColumns;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:int}/columns")]
[Authorize(Policy = "ManagerOrAdmin")]
public class BoardColumnsController : ControllerBase
{
    private readonly IBoardColumnService _columnService;

    public BoardColumnsController(IBoardColumnService columnService)
        => _columnService = columnService;

    [HttpGet]
    public async Task<ActionResult<List<BoardColumnDto>>> GetByProject(int projectId, CancellationToken ct)
        => Ok(await _columnService.GetByProjectAsync(projectId, ct));

    [HttpPost]
    public async Task<ActionResult<BoardColumnDto>> Create(int projectId, CreateBoardColumnDto body, CancellationToken ct)
    {
        body.ProjectId = projectId;
        var dto = await _columnService.CreateAsync(body, ct);
        return Created($"api/projects/{projectId}/columns/{dto.Id}", dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateBoardColumnDto body, CancellationToken ct)
        => await _columnService.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _columnService.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
