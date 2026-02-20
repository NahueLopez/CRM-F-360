using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class TimeEntryConfiguration : IEntityTypeConfiguration<TimeEntry>
{
    public void Configure(EntityTypeBuilder<TimeEntry> builder)
    {
        builder.ToTable("TimeEntries");
        builder.HasKey(te => te.Id);
        builder.Property(te => te.Hours).HasPrecision(6, 2);
        builder.Property(te => te.Date).IsRequired();

        builder.HasOne(te => te.Task)
            .WithMany(t => t.TimeEntries)
            .HasForeignKey(te => te.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(te => te.User)
            .WithMany()
            .HasForeignKey(te => te.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
