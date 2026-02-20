namespace CRMF360.Domain.Entities;

public class ChatConversation
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public bool IsGroup { get; set; }
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    public User CreatedBy { get; set; } = null!;
    public ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
