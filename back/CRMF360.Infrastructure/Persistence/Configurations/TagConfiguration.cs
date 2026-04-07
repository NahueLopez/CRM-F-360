using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("Tags");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).IsRequired().HasMaxLength(50);
        builder.Property(t => t.Color).HasMaxLength(20);
        builder.HasIndex(t => new { t.TenantId, t.Name }).IsUnique();
    }
}

public class CompanyTagConfiguration : IEntityTypeConfiguration<CompanyTag>
{
    public void Configure(EntityTypeBuilder<CompanyTag> builder)
    {
        builder.ToTable("CompanyTags");
        builder.HasKey(ct => new { ct.CompanyId, ct.TagId });

        builder.HasOne(ct => ct.Company)
            .WithMany(c => c.CompanyTags)
            .HasForeignKey(ct => ct.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ct => ct.Tag)
            .WithMany(t => t.CompanyTags)
            .HasForeignKey(ct => ct.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ContactTagConfiguration : IEntityTypeConfiguration<ContactTag>
{
    public void Configure(EntityTypeBuilder<ContactTag> builder)
    {
        builder.ToTable("ContactTags");
        builder.HasKey(ct => new { ct.ContactId, ct.TagId });

        builder.HasOne(ct => ct.Contact)
            .WithMany(c => c.ContactTags)
            .HasForeignKey(ct => ct.ContactId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ct => ct.Tag)
            .WithMany(t => t.ContactTags)
            .HasForeignKey(ct => ct.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class DealTagConfiguration : IEntityTypeConfiguration<DealTag>
{
    public void Configure(EntityTypeBuilder<DealTag> builder)
    {
        builder.ToTable("DealTags");
        builder.HasKey(dt => new { dt.DealId, dt.TagId });

        builder.HasOne(dt => dt.Deal)
            .WithMany(d => d.DealTags)
            .HasForeignKey(dt => dt.DealId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(dt => dt.Tag)
            .WithMany(t => t.DealTags)
            .HasForeignKey(dt => dt.TagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
