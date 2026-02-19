namespace CRMF360.Application.Contacts;

public interface IContactService
{
    Task<List<ContactDto>> GetAllAsync(CancellationToken ct = default);
    Task<List<ContactDto>> GetByCompanyAsync(int companyId, CancellationToken ct = default);
    Task<ContactDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ContactDto> CreateAsync(CreateContactDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateContactDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
