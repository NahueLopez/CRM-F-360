namespace CRMF360.Domain.Entities;

public class Attachment : ITenantEntity
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = null!;

    /// <summary>Company, Contact, Deal, Project</summary>
    public string EntityType { get; set; } = null!;
    public int EntityId { get; set; }

    public int UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User UploadedBy { get; set; } = null!;
}
