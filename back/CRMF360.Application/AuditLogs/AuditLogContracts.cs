namespace CRMF360.Application.AuditLogs;

public class AuditLogDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string EntityType { get; set; } = null!;
    public int? EntityId { get; set; }
    public string? EntityName { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}

public interface IAuditLogService
{
    Task<List<AuditLogDto>> GetAllAsync(int page = 1, int pageSize = 50, CancellationToken ct = default);
    Task<List<AuditLogDto>> GetByEntityAsync(string entityType, int entityId, CancellationToken ct = default);
    Task LogAsync(int userId, string action, string entityType, int? entityId = null,
        string? entityName = null, string? details = null, CancellationToken ct = default);
}
