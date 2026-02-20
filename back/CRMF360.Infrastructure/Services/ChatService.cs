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

        var conversations = await _db.ChatConversations
            .Where(c => convIds.Contains(c.Id))
            .Include(c => c.Participants).ThenInclude(p => p.User)
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync(ct);

        var result = new List<ConversationDto>();

        foreach (var conv in conversations)
        {
            var lastMsg = await _db.ChatMessages
                .Where(m => m.ConversationId == conv.Id)
                .OrderByDescending(m => m.SentAt)
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(ct);

            var participant = conv.Participants.FirstOrDefault(p => p.UserId == userId);
            var unread = 0;
            if (participant?.LastReadAt is not null)
            {
                unread = await _db.ChatMessages.CountAsync(
                    m => m.ConversationId == conv.Id && m.SentAt > participant.LastReadAt && m.SenderId != userId, ct);
            }
            else if (participant is not null)
            {
                unread = await _db.ChatMessages.CountAsync(
                    m => m.ConversationId == conv.Id && m.SenderId != userId, ct);
            }

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
            return convs.First(c => c.Id == existing);
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
        var participations = await _db.ChatParticipants
            .Where(p => p.UserId == userId)
            .Select(p => new { p.ConversationId, p.LastReadAt })
            .ToListAsync(ct);

        var total = 0;
        foreach (var p in participations)
        {
            if (p.LastReadAt is not null)
            {
                total += await _db.ChatMessages.CountAsync(
                    m => m.ConversationId == p.ConversationId && m.SentAt > p.LastReadAt && m.SenderId != userId, ct);
            }
            else
            {
                total += await _db.ChatMessages.CountAsync(
                    m => m.ConversationId == p.ConversationId && m.SenderId != userId, ct);
            }
        }

        return total;
    }
}
