using CRMF360.Application.PersonasEmpresa;

namespace CRMF360.Application.PersonasEmpresa;

public interface IPersonaEmpresaService
{
    Task<List<PersonaEmpresaDto>> GetAllAsync();            
    Task<List<PersonaEmpresaDto>> GetByEmpresaAsync(int empresaId);
    Task<PersonaEmpresaDto?> GetByIdAsync(int id);
    Task<PersonaEmpresaDto> CreateAsync(CreatePersonaEmpresaRequest request);
    Task<bool> UpdateAsync(int id, UpdatePersonaEmpresaRequest request);
    Task<bool> SoftDeleteAsync(int id);
}
