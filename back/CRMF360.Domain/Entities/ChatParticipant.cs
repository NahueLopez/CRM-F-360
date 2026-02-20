namespace CRMF360.Domain.Entities;

public class ChatParticipant
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public int UserId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReadAt { get; set; }

    public ChatConversation Conversation { get; set; } = null!;
    public User User { get; set; } = null!;
}
