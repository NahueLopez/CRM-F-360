namespace CRMF360.Application.Companies;

public interface ICompanyService
{
    Task<List<CompanyDto>> GetAllAsync(CancellationToken ct = default);
    Task<CompanyDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CompanyDto> CreateAsync(CreateCompanyDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateCompanyDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
