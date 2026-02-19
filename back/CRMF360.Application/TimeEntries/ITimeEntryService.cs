namespace CRMF360.Application.TimeEntries;

public interface ITimeEntryService
{
    Task<List<TimeEntryDto>> GetAllAsync(CancellationToken ct = default);
    Task<List<TimeEntryDto>> GetByTaskAsync(int taskId, CancellationToken ct = default);
    Task<List<TimeEntryDto>> GetByUserAsync(int userId, CancellationToken ct = default);
    Task<TimeEntryDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TimeEntryDto> CreateAsync(CreateTimeEntryDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateTimeEntryDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<List<ProjectHoursSummaryDto>> GetProjectHoursSummaryAsync(CancellationToken ct = default);
}
