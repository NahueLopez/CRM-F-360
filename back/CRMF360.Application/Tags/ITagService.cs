namespace CRMF360.Application.Tags;

public interface ITagService
{
    Task<List<TagDto>> GetAllAsync(CancellationToken ct = default);
    Task<TagDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TagDto> CreateAsync(CreateTagDto dto, CancellationToken ct = default);
    Task<TagDto?> UpdateAsync(int id, UpdateTagDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);

    // Assign/unassign
    Task<bool> AssignToCompanyAsync(int companyId, int tagId, CancellationToken ct = default);
    Task<bool> UnassignFromCompanyAsync(int companyId, int tagId, CancellationToken ct = default);
    Task<List<TagDto>> GetByCompanyAsync(int companyId, CancellationToken ct = default);

    Task<bool> AssignToContactAsync(int contactId, int tagId, CancellationToken ct = default);
    Task<bool> UnassignFromContactAsync(int contactId, int tagId, CancellationToken ct = default);
    Task<List<TagDto>> GetByContactAsync(int contactId, CancellationToken ct = default);

    Task<bool> AssignToDealAsync(int dealId, int tagId, CancellationToken ct = default);
    Task<bool> UnassignFromDealAsync(int dealId, int tagId, CancellationToken ct = default);
    Task<List<TagDto>> GetByDealAsync(int dealId, CancellationToken ct = default);
}
