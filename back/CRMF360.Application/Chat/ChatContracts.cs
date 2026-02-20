namespace CRMF360.Application.Chat;

// ─── DTOs ────────────────────────────────────────────────────────

public class ConversationDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public bool IsGroup { get; set; }
    public DateTime LastMessageAt { get; set; }
    public string? LastMessageContent { get; set; }
    public string? LastMessageSenderName { get; set; }
    public int UnreadCount { get; set; }
    public List<ParticipantDto> Participants { get; set; } = [];
}

public class ParticipantDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public DateTime? LastReadAt { get; set; }
}

public class ChatMessageDto
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public int SenderId { get; set; }
    public string SenderName { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }
}

// ─── Create / Send ──────────────────────────────────────────────

public class CreateGroupDto
{
    public string Name { get; set; } = null!;
    public List<int> MemberIds { get; set; } = [];
}

public class SendMessageDto
{
    public string Content { get; set; } = null!;
}

// ─── Interface ──────────────────────────────────────────────────

public interface IChatService
{
    Task<List<ConversationDto>> GetConversationsAsync(int userId, CancellationToken ct = default);
    Task<ConversationDto> GetOrCreateDmAsync(int currentUserId, int otherUserId, CancellationToken ct = default);
    Task<ConversationDto> CreateGroupAsync(int creatorId, CreateGroupDto dto, CancellationToken ct = default);
    Task<List<ChatMessageDto>> GetMessagesAsync(int conversationId, int userId, int take = 50, int? beforeId = null, CancellationToken ct = default);
    Task<ChatMessageDto> SendMessageAsync(int conversationId, int senderId, string content, CancellationToken ct = default);
    Task MarkReadAsync(int conversationId, int userId, CancellationToken ct = default);
    Task<int> GetTotalUnreadAsync(int userId, CancellationToken ct = default);
}
