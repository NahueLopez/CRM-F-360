using CRMF360.Application.PersonasEmpresa;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PersonasEmpresaController : ControllerBase
{
    private readonly IPersonaEmpresaService _service;

    public PersonasEmpresaController(IPersonaEmpresaService service)
    {
        _service = service;
    }

    // GET: api/PersonasEmpresa?empresaId=5  (opcional, pero práctico)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PersonaEmpresaDto>>> GetAll([FromQuery] int? empresaId)
    {
        if (empresaId.HasValue)
        {
            var personas = await _service.GetByEmpresaAsync(empresaId.Value);
            return Ok(personas);
        }

        var all = await _service.GetAllAsync();  
        return Ok(all);
    }

    // GET: api/PersonasEmpresa/by-empresa/5  (si querés mantener la ruta específica)
    [HttpGet("by-empresa/{empresaId:int}")]
    public async Task<ActionResult<IEnumerable<PersonaEmpresaDto>>> GetByEmpresa(int empresaId)
    {
        var personas = await _service.GetByEmpresaAsync(empresaId);
        return Ok(personas);
    }

    // GET: api/PersonasEmpresa/10
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PersonaEmpresaDto>> GetPersona(int id)
    {
        var persona = await _service.GetByIdAsync(id);
        if (persona == null) return NotFound();
        return Ok(persona);
    }

    // POST: api/PersonasEmpresa
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PersonaEmpresaDto>> CrearPersona([FromBody] CreatePersonaEmpresaRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request);
            return CreatedAtAction(nameof(GetPersona), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            // Ej: "Ya existe una persona con ese email en esta empresa"
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/PersonasEmpresa/10
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ActualizarPersona(int id, [FromBody] UpdatePersonaEmpresaRequest request)
    {
        try
        {
            var ok = await _service.UpdateAsync(id, request);
            if (!ok) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // DELETE lógico: api/PersonasEmpresa/10
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BorrarPersona(int id)
    {
        try
        {
            var ok = await _service.SoftDeleteAsync(id);
            if (!ok) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
