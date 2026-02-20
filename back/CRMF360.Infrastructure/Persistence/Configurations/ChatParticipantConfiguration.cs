using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class ChatParticipantConfiguration : IEntityTypeConfiguration<ChatParticipant>
{
    public void Configure(EntityTypeBuilder<ChatParticipant> builder)
    {
        builder.ToTable("ChatParticipants");
        builder.HasKey(p => p.Id);
        builder.HasOne(p => p.Conversation).WithMany(c => c.Participants).HasForeignKey(p => p.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(p => new { p.ConversationId, p.UserId }).IsUnique();
        builder.HasIndex(p => p.UserId);
    }
}
