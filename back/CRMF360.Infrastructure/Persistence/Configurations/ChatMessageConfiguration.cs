using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRMF360.Infrastructure.Persistence.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Content).HasMaxLength(4000).IsRequired();
        builder.HasOne(m => m.Conversation).WithMany(c => c.Messages).HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(m => m.Sender).WithMany().HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(m => new { m.ConversationId, m.SentAt });
    }
}
