using CRMF360.Application.Empresas;

namespace CRMF360.Application.Proyectos;

public interface IProyectoService
{
    Task<List<ProyectoDto>> GetAllAsync();               

    Task<List<ProyectoDto>> GetByEmpresaAsync(int empresaId);
    Task<ProyectoDto?> GetByIdAsync(int id);
    Task<ProyectoDto> CreateAsync(CreateProyectoRequest request);
    Task<bool> UpdateAsync(int id, UpdateProyectoRequest request);
    Task<bool> DeleteAsync(int id);
    Task<ProyectoResumenDto?> GetResumenAsync(int proyectoId);
}
