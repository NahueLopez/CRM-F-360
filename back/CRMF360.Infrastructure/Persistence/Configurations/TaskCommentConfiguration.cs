using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class TaskCommentConfiguration : IEntityTypeConfiguration<TaskComment>
{
    public void Configure(EntityTypeBuilder<TaskComment> builder)
    {
        builder.ToTable("TaskComments");
        builder.HasKey(tc => tc.Id);
        builder.Property(tc => tc.Content).HasMaxLength(4000).IsRequired();

        builder.HasOne(tc => tc.Task)
            .WithMany(t => t.Comments)
            .HasForeignKey(tc => tc.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(tc => tc.User)
            .WithMany()
            .HasForeignKey(tc => tc.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
