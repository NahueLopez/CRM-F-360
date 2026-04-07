using CRMF360.Application.Abstractions;
using CRMF360.Application.Attachments;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class AttachmentService : IAttachmentService
{
    private readonly IApplicationDbContext _db;
    private readonly string _uploadRoot;

    public AttachmentService(IApplicationDbContext db)
    {
        _db = db;
        _uploadRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
    }

    public async Task<List<AttachmentDto>> GetByEntityAsync(string entityType, int entityId, CancellationToken ct = default)
        => await _db.Attachments.AsNoTracking()
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .Include(a => a.UploadedBy)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => Map(a))
            .ToListAsync(ct);

    public async Task<AttachmentDto> UploadAsync(string entityType, int entityId, int userId, string fileName, string contentType, Stream fileStream, CancellationToken ct = default)
    {
        var guid = Guid.NewGuid().ToString("N");
        var ext = Path.GetExtension(fileName);
        var relativePath = Path.Combine(entityType.ToLower(), $"{guid}{ext}");
        var fullPath = Path.Combine(_uploadRoot, relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        using (var fs = new FileStream(fullPath, FileMode.Create))
            await fileStream.CopyToAsync(fs, ct);

        var entity = new Attachment
        {
            FileName = fileName,
            ContentType = contentType,
            FileSize = new FileInfo(fullPath).Length,
            StoragePath = relativePath,
            EntityType = entityType,
            EntityId = entityId,
            UploadedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };
        _db.Attachments.Add(entity);
        await _db.SaveChangesAsync(ct);

        var loaded = await _db.Attachments.AsNoTracking().Include(a => a.UploadedBy).FirstAsync(a => a.Id == entity.Id, ct);
        return Map(loaded);
    }

    public async Task<(Stream Stream, string FileName, string ContentType)?> DownloadAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Attachments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null) return null;

        var fullPath = Path.Combine(_uploadRoot, entity.StoragePath);
        if (!File.Exists(fullPath)) return null;

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        return (stream, entity.FileName, entity.ContentType);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Attachments.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null) return false;

        var fullPath = Path.Combine(_uploadRoot, entity.StoragePath);
        if (File.Exists(fullPath)) File.Delete(fullPath);

        _db.Attachments.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static AttachmentDto Map(Attachment a) => new()
    {
        Id = a.Id,
        FileName = a.FileName,
        ContentType = a.ContentType,
        FileSize = a.FileSize,
        EntityType = a.EntityType,
        EntityId = a.EntityId,
        UploadedByUserId = a.UploadedByUserId,
        UploadedByName = a.UploadedBy?.FullName ?? "—",
        CreatedAt = a.CreatedAt
    };
}
