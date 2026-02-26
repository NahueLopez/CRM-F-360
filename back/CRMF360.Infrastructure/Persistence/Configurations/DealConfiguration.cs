using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class DealConfiguration : IEntityTypeConfiguration<Deal>
{
    public void Configure(EntityTypeBuilder<Deal> builder)
    {
        builder.ToTable("Deals");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Title).HasMaxLength(200).IsRequired();
        builder.Property(d => d.Notes).HasMaxLength(4000);
        builder.Property(d => d.Currency).HasMaxLength(10);
        builder.Property(d => d.Value).HasColumnType("decimal(18,2)");
        builder.Property(d => d.Stage).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(d => d.Company).WithMany().HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(d => d.Contact).WithMany().HasForeignKey(d => d.ContactId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(d => d.AssignedTo).WithMany().HasForeignKey(d => d.AssignedToId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(d => d.Stage);
        builder.HasIndex(d => d.TenantId);
    }
}
