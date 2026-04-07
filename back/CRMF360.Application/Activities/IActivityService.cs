namespace CRMF360.Application.Activities;

public interface IActivityService
{
    Task<List<ActivityLogDto>> GetByCompanyAsync(int companyId, CancellationToken ct = default);
    Task<List<ActivityLogDto>> GetByContactAsync(int contactId, CancellationToken ct = default);
    Task<List<ActivityLogDto>> GetByProjectAsync(int projectId, CancellationToken ct = default);
    Task<List<ActivityLogDto>> GetRecentAsync(int count = 20, CancellationToken ct = default);
    Task<ActivityLogDto> CreateAsync(CreateActivityDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<List<ActivityLogDto>> GetByDealAsync(int dealId, CancellationToken ct = default);
    Task<List<TimelineItemDto>> GetTimelineAsync(int? companyId, int? contactId, int? dealId, CancellationToken ct = default);
}
