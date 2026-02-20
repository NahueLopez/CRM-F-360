namespace CRMF360.Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public int SenderId { get; set; }
    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    public ChatConversation Conversation { get; set; } = null!;
    public User Sender { get; set; } = null!;
}
