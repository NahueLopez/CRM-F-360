using CRMF360.Api.Extensions;
using CRMF360.Application.TaskComments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/tasks/{taskId:int}/comments")]
[Authorize]
public class TaskCommentsController : ControllerBase
{
    private readonly ITaskCommentService _service;
    public TaskCommentsController(ITaskCommentService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetByTask(int taskId, CancellationToken ct)
        => Ok(await _service.GetByTaskAsync(taskId, ct));

    [HttpPost]
    public async Task<IActionResult> Create(int taskId, [FromBody] CreateTaskCommentDto body, CancellationToken ct)
    {
        body.TaskId = taskId;
        body.UserId = User.GetUserId();
        var dto = await _service.CreateAsync(body, ct);
        return Created($"api/tasks/{taskId}/comments/{dto.Id}", dto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
