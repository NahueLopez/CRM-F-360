using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("ActivityLogs");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Type).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Description).HasMaxLength(4000).IsRequired();

        builder.HasOne(a => a.Company)
            .WithMany(c => c.Activities)
            .HasForeignKey(a => a.CompanyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Contact)
            .WithMany(c => c.Activities)
            .HasForeignKey(a => a.ContactId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Project)
            .WithMany()
            .HasForeignKey(a => a.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
