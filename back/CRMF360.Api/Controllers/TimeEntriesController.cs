using CRMF360.Application.TimeEntries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeEntriesController : ControllerBase
{
    private readonly ITimeEntryService _service;

    public TimeEntriesController(ITimeEntryService service)
    {
        _service = service;
    }

    // GET api/timeentries/by-proyecto/5
    [HttpGet("by-proyecto/{proyectoId:int}")]
    public async Task<ActionResult<IEnumerable<TimeEntryDto>>> GetByProyecto(int proyectoId)
    {
        var horas = await _service.GetByProyectoAsync(proyectoId);
        return Ok(horas);
    }

    // GET api/timeentries/by-usuario/{usuarioId}
    [HttpGet("by-usuario/{usuarioId:int}")]
    public async Task<ActionResult<IEnumerable<TimeEntryDto>>> GetByUsuario(int usuarioId)
    {
        var horas = await _service.GetByUsuarioAsync(usuarioId);
        return Ok(horas);
    }


    // POST api/timeentries
    [HttpPost]
    public async Task<ActionResult<TimeEntryDto>> Create([FromBody] CreateTimeEntryRequest request)
    {
        var created = await _service.CreateAsync(request);
        return CreatedAtAction(
            nameof(GetByProyecto),
            new { proyectoId = created.ProyectoId },
            created
        );
    }

    // DELETE api/timeentries/10
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _service.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
