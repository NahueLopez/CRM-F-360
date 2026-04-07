using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.CustomFields;

public class CustomFieldDefinitionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string FieldType { get; set; } = null!;
    public string EntityType { get; set; } = null!;
    public bool IsRequired { get; set; }
    public string? Options { get; set; }
    public int SortOrder { get; set; }
}

public class CreateCustomFieldDefinitionDto
{
    [Required][MaxLength(100)] public string Name { get; set; } = null!;
    [Required][MaxLength(20)] public string FieldType { get; set; } = "text";
    [Required][MaxLength(20)] public string EntityType { get; set; } = null!;
    public bool IsRequired { get; set; }
    [MaxLength(2000)] public string? Options { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateCustomFieldDefinitionDto
{
    [Required][MaxLength(100)] public string Name { get; set; } = null!;
    [Required][MaxLength(20)] public string FieldType { get; set; } = "text";
    public bool IsRequired { get; set; }
    [MaxLength(2000)] public string? Options { get; set; }
    public int SortOrder { get; set; }
}

public class CustomFieldValueDto
{
    public int DefinitionId { get; set; }
    public string FieldName { get; set; } = null!;
    public string FieldType { get; set; } = null!;
    public string? Value { get; set; }
    public bool IsRequired { get; set; }
    public string? Options { get; set; }
}

public class SetCustomFieldValueDto
{
    [Required] public int DefinitionId { get; set; }
    [MaxLength(4000)] public string? Value { get; set; }
}
