using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class CustomFieldDefinitionConfiguration : IEntityTypeConfiguration<CustomFieldDefinition>
{
    public void Configure(EntityTypeBuilder<CustomFieldDefinition> builder)
    {
        builder.ToTable("CustomFieldDefinitions");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Name).IsRequired().HasMaxLength(100);
        builder.Property(d => d.FieldType).IsRequired().HasMaxLength(20);
        builder.Property(d => d.EntityType).IsRequired().HasMaxLength(20);
        builder.Property(d => d.Options).HasMaxLength(2000);
        builder.HasIndex(d => new { d.TenantId, d.EntityType, d.Name }).IsUnique();
    }
}

public class CustomFieldValueConfiguration : IEntityTypeConfiguration<CustomFieldValue>
{
    public void Configure(EntityTypeBuilder<CustomFieldValue> builder)
    {
        builder.ToTable("CustomFieldValues");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.EntityType).IsRequired().HasMaxLength(20);
        builder.Property(v => v.Value).HasMaxLength(4000);

        // One value per definition per entity
        builder.HasIndex(v => new { v.DefinitionId, v.EntityType, v.EntityId }).IsUnique();

        builder.HasOne(v => v.Definition)
            .WithMany(d => d.Values)
            .HasForeignKey(v => v.DefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
