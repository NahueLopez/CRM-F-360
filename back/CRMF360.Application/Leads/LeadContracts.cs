using System.ComponentModel.DataAnnotations;
using CRMF360.Application.Common;

namespace CRMF360.Application.Leads;

public class LeadDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Company { get; set; }
    public string? Position { get; set; }
    public string Source { get; set; } = null!;
    public string Status { get; set; } = null!;
    public decimal? EstimatedValue { get; set; }
    public string? Notes { get; set; }
    public int? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public int? ConvertedContactId { get; set; }
    public int? ConvertedDealId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConvertedAt { get; set; }
}

public class CreateLeadDto
{
    [Required][MaxLength(200)] public string FullName { get; set; } = null!;
    [EmailAddress][MaxLength(200)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(200)] public string? Company { get; set; }
    [MaxLength(100)] public string? Position { get; set; }
    public string Source { get; set; } = "Other";
    public decimal? EstimatedValue { get; set; }
    [MaxLength(4000)] public string? Notes { get; set; }
    public int? AssignedToId { get; set; }
}

public class UpdateLeadDto
{
    [Required][MaxLength(200)] public string FullName { get; set; } = null!;
    [EmailAddress][MaxLength(200)] public string? Email { get; set; }
    [MaxLength(50)] public string? Phone { get; set; }
    [MaxLength(200)] public string? Company { get; set; }
    [MaxLength(100)] public string? Position { get; set; }
    public string? Status { get; set; }
    public decimal? EstimatedValue { get; set; }
    [MaxLength(4000)] public string? Notes { get; set; }
    public int? AssignedToId { get; set; }
}

/// <summary>
/// DTO for converting a Lead into a Contact + Deal.
/// </summary>
public class ConvertLeadDto
{
    public int? CompanyId { get; set; }
    public string? DealTitle { get; set; }
    public string DealStage { get; set; } = "Qualification";
}

public interface ILeadService
{
    Task<PagedResult<LeadDto>> GetPagedAsync(PaginationParams p, CancellationToken ct = default);
    Task<LeadDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<LeadDto> CreateAsync(int userId, CreateLeadDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateLeadDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<LeadDto?> ConvertAsync(int id, ConvertLeadDto dto, CancellationToken ct = default);
}
