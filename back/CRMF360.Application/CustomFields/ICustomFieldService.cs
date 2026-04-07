namespace CRMF360.Application.CustomFields;

public interface ICustomFieldService
{
    // Definitions
    Task<List<CustomFieldDefinitionDto>> GetDefinitionsAsync(string entityType, CancellationToken ct = default);
    Task<CustomFieldDefinitionDto> CreateDefinitionAsync(CreateCustomFieldDefinitionDto dto, CancellationToken ct = default);
    Task<CustomFieldDefinitionDto?> UpdateDefinitionAsync(int id, UpdateCustomFieldDefinitionDto dto, CancellationToken ct = default);
    Task<bool> DeleteDefinitionAsync(int id, CancellationToken ct = default);

    // Values
    Task<List<CustomFieldValueDto>> GetValuesAsync(string entityType, int entityId, CancellationToken ct = default);
    Task SetValuesAsync(string entityType, int entityId, List<SetCustomFieldValueDto> values, CancellationToken ct = default);
}
