using CRMF360.Application.Tareas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TareasController : ControllerBase
{
    private readonly ITareaService _tareaService;

    public TareasController(ITareaService tareaService)
    {
        _tareaService = tareaService;
    }

    [HttpGet("by-proyecto/{proyectoId:int}")]
    public async Task<ActionResult<IEnumerable<TareaDto>>> GetByProyecto(int proyectoId)
    {
        var result = await _tareaService.GetByProyectoAsync(proyectoId);
        return Ok(result);
    }

    [HttpGet("by-usuario/{userId:int}")]
    public async Task<ActionResult<IEnumerable<TareaDto>>> GetByUsuario(int userId)
    {
        var result = await _tareaService.GetByUsuarioAsync(userId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TareaDto>> GetById(int id)
    {
        var tarea = await _tareaService.GetByIdAsync(id);
        if (tarea == null) return NotFound();
        return Ok(tarea);
    }

    [HttpPost]
    public async Task<ActionResult<TareaDto>> Create([FromBody] CreateTareaRequest request)
    {
        var created = await _tareaService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTareaRequest request)
    {
        var ok = await _tareaService.UpdateAsync(id, request);
        if (!ok) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _tareaService.DeleteAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
