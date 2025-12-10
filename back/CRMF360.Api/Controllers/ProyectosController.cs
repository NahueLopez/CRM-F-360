using CRMF360.Application.Empresas;
using CRMF360.Application.Proyectos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProyectosController : ControllerBase
{
    private readonly IProyectoService _service;

    public ProyectosController(IProyectoService service)
    {
        _service = service;
    }

    // GET: api/Proyectos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProyectoDto>>> GetAll()
    {
        var proyectos = await _service.GetAllAsync();
        return Ok(proyectos);
    }

    // GET: api/Proyectos/by-empresa/5
    [HttpGet("by-empresa/{empresaId:int}")]
    public async Task<ActionResult<IEnumerable<ProyectoDto>>> GetByEmpresa(int empresaId)
    {
        var proyectos = await _service.GetByEmpresaAsync(empresaId);
        return Ok(proyectos);
    }

    // GET: api/Proyectos/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProyectoDto>> GetProyecto(int id)
    {
        var proyecto = await _service.GetByIdAsync(id);
        return proyecto is null ? NotFound() : Ok(proyecto);
    }

    // POST: api/Proyectos
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProyectoDto>> CrearProyecto([FromBody] CreateProyectoRequest request)
    {
        var proyecto = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetProyecto), new { id = proyecto.Id }, proyecto);
    }

    // PUT: api/Proyectos/5
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ActualizarProyecto(int id, [FromBody] UpdateProyectoRequest request)
    {
        var ok = await _service.UpdateAsync(id, request);

        if (!ok)
            return NotFound(); // o BadRequest si el service te devuelve info de validación

        return NoContent();
    }

    // DELETE: api/Proyectos/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BorrarProyecto(int id)
    {
        var ok = await _service.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    // GET: api/Proyectos/5/resumen
    [HttpGet("{id:int}/resumen")]
    public async Task<ActionResult<ProyectoResumenDto>> GetResumen(int id)
    {
        var resumen = await _service.GetResumenAsync(id);
        return resumen is null ? NotFound() : Ok(resumen);
    }
}
