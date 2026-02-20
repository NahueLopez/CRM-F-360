using CRMF360.Application.Abstractions;
using CRMF360.Application.Chat;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace CRMF360.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly IApplicationDbContext _db;
    public ChatService(IApplicationDbContext db) => _db = db;

    public async Task<List<ConversationDto>> GetConversationsAsync(int userId, CancellationToken ct = default)
    {
        var convIds = await _db.ChatParticipants
            .Where(p => p.UserId == userId)
            .Select(p => p.ConversationId)
            .ToListAsync(ct);

        if (convIds.Count == 0) return [];

        // Single query: load conversations with participants
        var conversations = await _db.ChatConversations
            .Where(c => convIds.Contains(c.Id))
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync(ct);

        // Batch: get last message per conversation
        var lastMessageIds = await _db.ChatMessages
            .Where(m => convIds.Contains(m.ConversationId))
            .GroupBy(m => m.ConversationId)
            .Select(g => g.OrderByDescending(m => m.SentAt).Select(m => m.Id).First())
            .ToListAsync(ct);

        var lastMessages = lastMessageIds.Count > 0
            ? await _db.ChatMessages
                .Where(m => lastMessageIds.Contains(m.Id))
                .Include(m => m.Sender)
                .ToDictionaryAsync(m => m.ConversationId, ct)
            : new Dictionary<int, ChatMessage>();

        // Batch: get user's LastReadAt per conversation
        var myParticipations = await _db.ChatParticipants
            .Where(p => p.UserId == userId && convIds.Contains(p.ConversationId))
            .ToDictionaryAsync(p => p.ConversationId, ct);

        // Batch: get unread counts in ONE query
        var unreadCounts = await _db.ChatMessages
            .Where(m => convIds.Contains(m.ConversationId) && m.SenderId != userId)
            .GroupBy(m => m.ConversationId)
            .Select(g => new
            {
                ConversationId = g.Key,
                Total = g.Count(),
                // Count messages after LastReadAt (we'll filter in memory)
            })
            .ToDictionaryAsync(x => x.ConversationId, ct);

        // Build per-conversation unread counts using SQL-level counting (no messages loaded into RAM)
        var unreadAfterRead = new Dictionary<int, int>();

        // Get LastReadAt map for the user
        var lastReadMap = myParticipations.ToDictionary(
            kv => kv.Key,
            kv => kv.Value.LastReadAt);

        // For conversations where user has a LastReadAt, count only messages after that time
        var convsWithRead = lastReadMap.Where(kv => kv.Value is not null).Select(kv => kv.Key).ToList();
        var convsWithoutRead = lastReadMap.Where(kv => kv.Value is null).Select(kv => kv.Key).ToList();

        if (convsWithRead.Count > 0)
        {
            // Per-conversation unread count using SQL-level CountAsync
            foreach (var convId in convsWithRead)
            {
                var readAt = lastReadMap[convId]!.Value;
                var count = await _db.ChatMessages.CountAsync(
                    m => m.ConversationId == convId && m.SenderId != userId && m.SentAt > readAt, ct);
                unreadAfterRead[convId] = count;
            }
        }

        if (convsWithoutRead.Count > 0)
        {
            // Never read — count all messages from others (SQL GroupBy)
            var unreadNoRead = await _db.ChatMessages
                .Where(m => convsWithoutRead.Contains(m.ConversationId) && m.SenderId != userId)
                .GroupBy(m => m.ConversationId)
                .Select(g => new { ConvId = g.Key, Count = g.Count() })
                .ToListAsync(ct);

            foreach (var item in unreadNoRead)
                unreadAfterRead[item.ConvId] = item.Count;
        }

        var result = new List<ConversationDto>(conversations.Count);
        foreach (var conv in conversations)
        {
            lastMessages.TryGetValue(conv.Id, out var lastMsg);
            unreadAfterRead.TryGetValue(conv.Id, out var unread);

            result.Add(new ConversationDto
            {
                Id = conv.Id,
                Name = conv.IsGroup ? conv.Name : conv.Participants.FirstOrDefault(p => p.UserId != userId)?.User?.FullName,
                IsGroup = conv.IsGroup,
                LastMessageAt = conv.LastMessageAt,
                LastMessageContent = lastMsg?.Content,
                LastMessageSenderName = lastMsg?.Sender?.FullName,
                UnreadCount = unread,
                Participants = conv.Participants.Select(p => new ParticipantDto
                {
                    UserId = p.UserId,
                    FullName = p.User?.FullName ?? "—",
                    LastReadAt = p.LastReadAt,
                }).ToList(),
            });
        }

        return result;
    }

    public async Task<ConversationDto> GetOrCreateDmAsync(int currentUserId, int otherUserId, CancellationToken ct = default)
    {
        // Find existing DM between these two users
        var existing = await _db.ChatConversations
            .Where(c => !c.IsGroup)
            .Where(c => c.Participants.Any(p => p.UserId == currentUserId)
                     && c.Participants.Any(p => p.UserId == otherUserId))
            .Where(c => c.Participants.Count == 2)
            .Select(c => c.Id)
            .FirstOrDefaultAsync(ct);

        if (existing > 0)
        {
            var convs = await GetConversationsAsync(currentUserId, ct);
            var found = convs.FirstOrDefault(c => c.Id == existing);
            if (found is not null) return found;

            // Fallback: conversation exists but wasn't in the user's list (edge case)
            var conv2 = await _db.ChatConversations
                .Include(c => c.Participants).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(c => c.Id == existing, ct);

            if (conv2 is not null)
            {
                return new ConversationDto
                {
                    Id = conv2.Id,
                    Name = conv2.Participants.FirstOrDefault(p => p.UserId != currentUserId)?.User?.FullName,
                    IsGroup = false,
                    LastMessageAt = conv2.LastMessageAt,
                    UnreadCount = 0,
                    Participants = conv2.Participants.Select(p => new ParticipantDto
                    {
                        UserId = p.UserId,
                        FullName = p.User?.FullName ?? "—",
                        LastReadAt = p.LastReadAt,
                    }).ToList(),
                };
            }
        }

        // Create new DM
        var conv = new ChatConversation
        {
            IsGroup = false,
            CreatedById = currentUserId,
        };
        _db.ChatConversations.Add(conv);
        await _db.SaveChangesAsync(ct);

        _db.ChatParticipants.Add(new ChatParticipant { ConversationId = conv.Id, UserId = currentUserId });
        _db.ChatParticipants.Add(new ChatParticipant { ConversationId = conv.Id, UserId = otherUserId });
        await _db.SaveChangesAsync(ct);

        var otherUser = await _db.Users.FindAsync(new object[] { otherUserId }, ct);

        return new ConversationDto
        {
            Id = conv.Id,
            Name = otherUser?.FullName,
            IsGroup = false,
            LastMessageAt = conv.LastMessageAt,
            UnreadCount = 0,
            Participants =
            [
                new() { UserId = currentUserId, FullName = (await _db.Users.FindAsync(new object[] { currentUserId }, ct))?.FullName ?? "—" },
                new() { UserId = otherUserId, FullName = otherUser?.FullName ?? "—" },
            ],
        };
    }

    public async Task<ConversationDto> CreateGroupAsync(int creatorId, CreateGroupDto dto, CancellationToken ct = default)
    {
        var conv = new ChatConversation
        {
            Name = dto.Name,
            IsGroup = true,
            CreatedById = creatorId,
        };
        _db.ChatConversations.Add(conv);
        await _db.SaveChangesAsync(ct);

        // Add creator + members
        var allIds = new HashSet<int>(dto.MemberIds) { creatorId };
        foreach (var uid in allIds)
        {
            _db.ChatParticipants.Add(new ChatParticipant { ConversationId = conv.Id, UserId = uid });
        }
        await _db.SaveChangesAsync(ct);

        var users = await _db.Users.Where(u => allIds.Contains(u.Id)).ToListAsync(ct);

        return new ConversationDto
        {
            Id = conv.Id,
            Name = dto.Name,
            IsGroup = true,
            LastMessageAt = conv.LastMessageAt,
            UnreadCount = 0,
            Participants = users.Select(u => new ParticipantDto
            {
                UserId = u.Id,
                FullName = u.FullName
            }).ToList(),
        };
    }

    public async Task<List<ChatMessageDto>> GetMessagesAsync(int conversationId, int userId, int take = 50, int? beforeId = null, CancellationToken ct = default)
    {
        var query = _db.ChatMessages
            .Where(m => m.ConversationId == conversationId)
            .Include(m => m.Sender)
            .AsQueryable();

        if (beforeId.HasValue)
            query = query.Where(m => m.Id < beforeId.Value);

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(take)
            .ToListAsync(ct);

        messages.Reverse(); // chronological order

        return messages.Select(m => new ChatMessageDto
        {
            Id = m.Id,
            ConversationId = m.ConversationId,
            SenderId = m.SenderId,
            SenderName = m.Sender?.FullName ?? "—",
            Content = m.Content,
            SentAt = m.SentAt,
        }).ToList();
    }

    public async Task<ChatMessageDto> SendMessageAsync(int conversationId, int senderId, string content, CancellationToken ct = default)
    {
        var msg = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = content.Trim(),
            SentAt = DateTime.UtcNow,
        };
        _db.ChatMessages.Add(msg);

        // Update conversation timestamp
        var conv = await _db.ChatConversations.FindAsync(new object[] { conversationId }, ct);
        if (conv is not null) conv.LastMessageAt = msg.SentAt;

        // Auto-mark as read for sender
        var participant = await _db.ChatParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == senderId, ct);
        if (participant is not null) participant.LastReadAt = msg.SentAt;

        await _db.SaveChangesAsync(ct);

        var sender = await _db.Users.FindAsync(new object[] { senderId }, ct);

        return new ChatMessageDto
        {
            Id = msg.Id,
            ConversationId = conversationId,
            SenderId = senderId,
            SenderName = sender?.FullName ?? "—",
            Content = msg.Content,
            SentAt = msg.SentAt,
        };
    }

    public async Task MarkReadAsync(int conversationId, int userId, CancellationToken ct = default)
    {
        var participant = await _db.ChatParticipants
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId, ct);
        if (participant is not null)
        {
            participant.LastReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<int> GetTotalUnreadAsync(int userId, CancellationToken ct = default)
    {
        // FIX #2: Single query instead of N+1 loop
        var participations = await _db.ChatParticipants
            .Where(p => p.UserId == userId)
            .Select(p => new { p.ConversationId, p.LastReadAt })
            .ToListAsync(ct);

        if (participations.Count == 0) return 0;

        var convIds = participations.Select(p => p.ConversationId).ToList();

        // Single query: get all unread messages across all conversations
        var allMessages = await _db.ChatMessages
            .Where(m => convIds.Contains(m.ConversationId) && m.SenderId != userId)
            .Select(m => new { m.ConversationId, m.SentAt })
            .ToListAsync(ct);

        var lastReadMap = participations.ToDictionary(p => p.ConversationId, p => p.LastReadAt);

        var total = 0;
        foreach (var msg in allMessages)
        {
            if (lastReadMap.TryGetValue(msg.ConversationId, out var lastRead))
            {
                if (lastRead is null || msg.SentAt > lastRead)
                    total++;
            }
        }

        return total;
    }

    /// <summary>Get participant user IDs for a specific conversation (lightweight query for ChatHub).</summary>
    public async Task<List<int>> GetParticipantIdsAsync(int conversationId, CancellationToken ct = default)
    {
        return await _db.ChatParticipants
            .Where(p => p.ConversationId == conversationId)
            .Select(p => p.UserId)
            .ToListAsync(ct);
    }
}
