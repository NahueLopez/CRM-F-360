using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> builder)
    {
        builder.ToTable("Leads");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.FullName).IsRequired().HasMaxLength(200);
        builder.Property(l => l.Email).HasMaxLength(200);
        builder.Property(l => l.Phone).HasMaxLength(50);
        builder.Property(l => l.Company).HasMaxLength(200);
        builder.Property(l => l.Position).HasMaxLength(100);
        builder.Property(l => l.Notes).HasMaxLength(4000);

        builder.HasOne(l => l.AssignedTo).WithMany().HasForeignKey(l => l.AssignedToId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(l => l.ConvertedContact).WithMany().HasForeignKey(l => l.ConvertedContactId).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(l => l.ConvertedDeal).WithMany().HasForeignKey(l => l.ConvertedDealId).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(l => l.TenantId);
        builder.HasIndex(l => l.Status);
        builder.HasIndex(l => l.Source);
    }
}
