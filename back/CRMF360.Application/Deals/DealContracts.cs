using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Deals;

public class DealDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public int? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public int? ContactId { get; set; }
    public string? ContactName { get; set; }
    public int? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public string Stage { get; set; } = null!;
    public decimal? Value { get; set; }
    public string? Currency { get; set; }
    public string? Notes { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDealDto
{
    [Required][MaxLength(200)] public string Title { get; set; } = null!;
    public int? CompanyId { get; set; }
    public int? ContactId { get; set; }
    public int? AssignedToId { get; set; }
    public string Stage { get; set; } = "Lead";
    public decimal? Value { get; set; }
    [MaxLength(10)] public string? Currency { get; set; } = "ARS";
    [MaxLength(4000)] public string? Notes { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
}

public class UpdateDealDto
{
    [Required][MaxLength(200)] public string Title { get; set; } = null!;
    public int? CompanyId { get; set; }
    public int? ContactId { get; set; }
    public int? AssignedToId { get; set; }
    public decimal? Value { get; set; }
    [MaxLength(10)] public string? Currency { get; set; }
    [MaxLength(4000)] public string? Notes { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
}

public class MoveDealDto
{
    [Required] public string Stage { get; set; } = null!;
    public int SortOrder { get; set; }
}

public class PipelineSummaryDto
{
    public string Stage { get; set; } = null!;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}

public interface IDealService
{
    Task<List<DealDto>> GetAllAsync(CancellationToken ct = default);
    Task<List<DealDto>> GetByStageAsync(string stage, CancellationToken ct = default);
    Task<DealDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<DealDto> CreateAsync(int userId, CreateDealDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateDealDto dto, CancellationToken ct = default);
    Task<bool> MoveAsync(int id, MoveDealDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<List<PipelineSummaryDto>> GetSummaryAsync(CancellationToken ct = default);
}
