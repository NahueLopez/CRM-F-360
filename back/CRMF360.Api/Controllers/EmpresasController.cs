using CRMF360.Domain.Entities;
using CRMF360.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmpresasController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EmpresasController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Empresas
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Empresa>>> GetEmpresas()
    {
        // si querés solo activas:
        // var lista = await _context.Empresas.Where(e => e.Activa).ToListAsync();
        var lista = await _context.Empresas.ToListAsync();
        return Ok(lista);
    }

    // GET: api/Empresas/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Empresa>> GetEmpresa(int id)
    {
        var empresa = await _context.Empresas.FindAsync(id);
        if (empresa == null) return NotFound();

        return Ok(empresa);
    }

    // POST: api/Empresas
    [HttpPost]
    [Authorize(Roles = "Admin")] // opcional
    public async Task<ActionResult<Empresa>> CrearEmpresa([FromBody] Empresa empresa)
    {
        // normalizar CUIT si querés: quitar guiones/espacios
        var cuit = empresa.Cuit?.Trim();

        // validar duplicado por CUIT (podés filtrar solo activas si querés)
        var yaExiste = await _context.Empresas
            .AnyAsync(e => e.Cuit == cuit);

        if (yaExiste)
        {
            return Conflict($"Ya existe una empresa con el CUIT {cuit}.");
        }

        empresa.Id = 0;
        empresa.Cuit = cuit;
        empresa.FechaAlta = DateTime.UtcNow;
        empresa.Activa = true;

        _context.Empresas.Add(empresa);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEmpresa), new { id = empresa.Id }, empresa);
    }

    // PUT: api/Empresas/5
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ActualizarEmpresa(int id, [FromBody] Empresa empresa)
    {
        if (id != empresa.Id)
            return BadRequest("El id de la URL no coincide con el del cuerpo.");

        var existing = await _context.Empresas.FindAsync(id);
        if (existing == null)
            return NotFound();

        var cuit = empresa.Cuit?.Trim();

        // ❗ validar que no haya OTRA empresa con el mismo CUIT
        var cuitEnUso = await _context.Empresas
            .AnyAsync(e => e.Cuit == cuit && e.Id != id);

        if (cuitEnUso)
        {
            return Conflict($"Ya existe otra empresa con el CUIT {cuit}.");
        }

        existing.RazonSocial = empresa.RazonSocial;
        existing.NombreFantasia = empresa.NombreFantasia;
        existing.Cuit = cuit;
        existing.Email = empresa.Email;
        existing.Telefono = empresa.Telefono;
        existing.Direccion = empresa.Direccion;
        existing.Activa = empresa.Activa;

        await _context.SaveChangesAsync();
        // Devolvemos la empresa actualizada para que el front la use
        return Ok(existing);
    }

    // DELETE lógico: api/Empresas/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BorrarEmpresa(int id)
    {
        var empresa = await _context.Empresas.FindAsync(id);
        if (empresa == null)
            return NotFound();

        empresa.Activa = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
