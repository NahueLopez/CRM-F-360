using CRMF360.Application.Common;

namespace CRMF360.Application.Contacts;

public interface IContactService
{
    /// <summary>Returns ALL contacts. Use for dropdowns only. For UI listings, use GetPagedAsync.</summary>
    Task<List<ContactDto>> GetAllAsync(CancellationToken ct = default);
    /// <summary>Returns paginated contacts with search and sorting. Preferred for UI listings.</summary>
    Task<PagedResult<ContactDto>> GetPagedAsync(PaginationParams p, CancellationToken ct = default);
    Task<List<ContactDto>> GetByCompanyAsync(int companyId, CancellationToken ct = default);
    Task<ContactDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ContactDto> CreateAsync(CreateContactDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateContactDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
