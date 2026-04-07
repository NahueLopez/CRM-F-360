namespace CRMF360.Application.Attachments;

public class AttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long FileSize { get; set; }
    public string EntityType { get; set; } = null!;
    public int EntityId { get; set; }
    public int UploadedByUserId { get; set; }
    public string UploadedByName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public interface IAttachmentService
{
    Task<List<AttachmentDto>> GetByEntityAsync(string entityType, int entityId, CancellationToken ct = default);
    Task<AttachmentDto> UploadAsync(string entityType, int entityId, int userId, string fileName, string contentType, Stream fileStream, CancellationToken ct = default);
    Task<(Stream Stream, string FileName, string ContentType)?> DownloadAsync(int id, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
