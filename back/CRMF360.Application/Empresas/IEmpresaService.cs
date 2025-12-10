using CRMF360.Application.Empresas;

namespace CRMF360.Application.Empresas;

public interface IEmpresaService
{
    Task<List<EmpresaDto>> GetEmpresasAsync(string? search);
    Task<EmpresaDto?> GetByIdAsync(int id);
    Task<EmpresaDto> CreateAsync(CreateEmpresaRequest request);
    Task<bool> UpdateAsync(int id, UpdateEmpresaRequest request);
    Task<bool> SoftDeleteAsync(int id);
}
