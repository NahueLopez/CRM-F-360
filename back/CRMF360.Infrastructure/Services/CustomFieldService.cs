using CRMF360.Application.Abstractions;
using CRMF360.Application.CustomFields;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace CRMF360.Infrastructure.Services;

public class CustomFieldService : ICustomFieldService
{
    private readonly IApplicationDbContext _db;
    public CustomFieldService(IApplicationDbContext db) => _db = db;

    // ── Definitions ──
    public async Task<List<CustomFieldDefinitionDto>> GetDefinitionsAsync(string entityType, CancellationToken ct = default)
        => await _db.CustomFieldDefinitions.AsNoTracking()
            .Where(d => d.EntityType == entityType)
            .OrderBy(d => d.SortOrder).ThenBy(d => d.Name)
            .Select(d => MapDef(d))
            .ToListAsync(ct);

    public async Task<CustomFieldDefinitionDto> CreateDefinitionAsync(CreateCustomFieldDefinitionDto dto, CancellationToken ct = default)
    {
        var entity = new CustomFieldDefinition
        {
            Name = dto.Name,
            FieldType = dto.FieldType,
            EntityType = dto.EntityType,
            IsRequired = dto.IsRequired,
            Options = dto.Options,
            SortOrder = dto.SortOrder,
            CreatedAt = DateTime.UtcNow
        };
        _db.CustomFieldDefinitions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return MapDef(entity);
    }

    public async Task<CustomFieldDefinitionDto?> UpdateDefinitionAsync(int id, UpdateCustomFieldDefinitionDto dto, CancellationToken ct = default)
    {
        var entity = await _db.CustomFieldDefinitions.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (entity is null) return null;
        entity.Name = dto.Name;
        entity.FieldType = dto.FieldType;
        entity.IsRequired = dto.IsRequired;
        entity.Options = dto.Options;
        entity.SortOrder = dto.SortOrder;
        await _db.SaveChangesAsync(ct);
        return MapDef(entity);
    }

    public async Task<bool> DeleteDefinitionAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.CustomFieldDefinitions.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (entity is null) return false;
        _db.CustomFieldDefinitions.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ── Values ──
    public async Task<List<CustomFieldValueDto>> GetValuesAsync(string entityType, int entityId, CancellationToken ct = default)
    {
        var definitions = await _db.CustomFieldDefinitions.AsNoTracking()
            .Where(d => d.EntityType == entityType)
            .OrderBy(d => d.SortOrder).ThenBy(d => d.Name)
            .ToListAsync(ct);

        var values = await _db.CustomFieldValues.AsNoTracking()
            .Where(v => v.EntityType == entityType && v.EntityId == entityId)
            .ToListAsync(ct);

        return definitions.Select(d => new CustomFieldValueDto
        {
            DefinitionId = d.Id,
            FieldName = d.Name,
            FieldType = d.FieldType,
            IsRequired = d.IsRequired,
            Options = d.Options,
            Value = values.FirstOrDefault(v => v.DefinitionId == d.Id)?.Value
        }).ToList();
    }

    public async Task SetValuesAsync(string entityType, int entityId, List<SetCustomFieldValueDto> values, CancellationToken ct = default)
    {
        var existing = await _db.CustomFieldValues
            .Where(v => v.EntityType == entityType && v.EntityId == entityId)
            .ToListAsync(ct);

        foreach (var dto in values)
        {
            var current = existing.FirstOrDefault(v => v.DefinitionId == dto.DefinitionId);
            if (current is not null)
            {
                current.Value = dto.Value;
            }
            else
            {
                _db.CustomFieldValues.Add(new CustomFieldValue
                {
                    DefinitionId = dto.DefinitionId,
                    EntityType = entityType,
                    EntityId = entityId,
                    Value = dto.Value
                });
            }
        }
        await _db.SaveChangesAsync(ct);
    }

    private static CustomFieldDefinitionDto MapDef(CustomFieldDefinition d) => new()
    {
        Id = d.Id,
        Name = d.Name,
        FieldType = d.FieldType,
        EntityType = d.EntityType,
        IsRequired = d.IsRequired,
        Options = d.Options,
        SortOrder = d.SortOrder
    };
}
