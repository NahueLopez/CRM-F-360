using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Type).HasMaxLength(50).IsRequired();
        builder.Property(n => n.Title).HasMaxLength(300).IsRequired();
        builder.Property(n => n.Message).HasMaxLength(2000);
        builder.Property(n => n.RelatedEntityType).HasMaxLength(50);

        builder.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(n => new { n.UserId, n.IsRead });
    }
}
