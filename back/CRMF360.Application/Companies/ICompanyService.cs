using CRMF360.Application.Common;

namespace CRMF360.Application.Companies;

public interface ICompanyService
{
    /// <summary>
    /// Returns ALL companies without pagination. Use only for dropdowns, CSV exports,
    /// and similar scenarios where the full list is needed. For UI listings, use GetPagedAsync.
    /// </summary>
    Task<List<CompanyDto>> GetAllAsync(CancellationToken ct = default);
    /// <summary>Returns paginated companies with search and sorting. Preferred for UI listings.</summary>
    Task<PagedResult<CompanyDto>> GetPagedAsync(PaginationParams p, CancellationToken ct = default);
    Task<CompanyDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CompanyDto> CreateAsync(CreateCompanyDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateCompanyDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
