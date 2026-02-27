using CRMF360.Api.Extensions;
using CRMF360.Application.BoardColumns;
using CRMF360.Application.ProjectMembers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId:int}/columns")]
[Authorize]
public class BoardColumnsController : ControllerBase
{
    private readonly IBoardColumnService _columnService;
    private readonly IProjectMemberService _memberService;

    public BoardColumnsController(IBoardColumnService columnService, IProjectMemberService memberService)
    {
        _columnService = columnService;
        _memberService = memberService;
    }

    [HttpGet]
    public async Task<ActionResult<List<BoardColumnDto>>> GetByProject(int projectId, CancellationToken ct)
    {
        // Must be member or admin
        if (!User.IsAdmin())
        {
            var isMember = await _memberService.IsMemberAsync(projectId, User.GetUserId(), ct);
            if (!isMember) return Forbid();
        }
        return Ok(await _columnService.GetByProjectAsync(projectId, ct));
    }

    [HttpPost]
    [Authorize(Policy = "projects.edit")]
    public async Task<ActionResult<BoardColumnDto>> Create(int projectId, CreateBoardColumnDto body, CancellationToken ct)
    {
        body.ProjectId = projectId;
        var dto = await _columnService.CreateAsync(body, ct);
        return Created($"api/projects/{projectId}/columns/{dto.Id}", dto);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "projects.edit")]
    public async Task<IActionResult> Update(int id, UpdateBoardColumnDto body, CancellationToken ct)
        => await _columnService.UpdateAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "projects.edit")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _columnService.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
