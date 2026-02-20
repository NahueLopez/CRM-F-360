using CRMF360.Api.Extensions;
using CRMF360.Application.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CRMF360.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chat;

    // Track online users: userId → set of connectionIds
    private static readonly Dictionary<int, HashSet<string>> OnlineUsers = new();
    private static readonly object Lock = new();

    public ChatHub(IChatService chat) => _chat = chat;

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User!.GetUserId();

        // Track connection
        lock (Lock)
        {
            if (!OnlineUsers.ContainsKey(userId))
                OnlineUsers[userId] = new HashSet<string>();
            OnlineUsers[userId].Add(Context.ConnectionId);
        }

        // Join all conversation groups
        var conversations = await _chat.GetConversationsAsync(userId);
        foreach (var conv in conversations)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"conv_{conv.Id}");
        }

        // Broadcast online status
        await Clients.Others.SendAsync("UserOnline", userId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User!.GetUserId();

        bool stillOnline;
        lock (Lock)
        {
            if (OnlineUsers.TryGetValue(userId, out var conns))
            {
                conns.Remove(Context.ConnectionId);
                if (conns.Count == 0)
                    OnlineUsers.Remove(userId);
            }
            stillOnline = OnlineUsers.ContainsKey(userId);
        }

        if (!stillOnline)
        {
            await Clients.Others.SendAsync("UserOffline", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>Send a message to a conversation. Persists and broadcasts.</summary>
    public async Task SendMessage(int conversationId, string content)
    {
        var userId = Context.User!.GetUserId();
        var msg = await _chat.SendMessageAsync(conversationId, userId, content);

        // FIX #4: Use lightweight query instead of loading ALL conversations
        var participantIds = await _chat.GetParticipantIdsAsync(conversationId);

        // FIX #3: Collect connection IDs outside lock, then await AddToGroupAsync outside lock
        var connectionsToAdd = new List<(string connId, string group)>();
        lock (Lock)
        {
            foreach (var pid in participantIds)
            {
                if (OnlineUsers.TryGetValue(pid, out var conns))
                {
                    foreach (var connId in conns)
                    {
                        connectionsToAdd.Add((connId, $"conv_{conversationId}"));
                    }
                }
            }
        }

        // Await async calls OUTSIDE the lock (fixes fire-and-forget + deadlock risk)
        foreach (var (connId, group) in connectionsToAdd)
        {
            await Groups.AddToGroupAsync(connId, group);
        }

        await Clients.Group($"conv_{conversationId}").SendAsync("ReceiveMessage", msg);
    }

    /// <summary>Typing indicator — broadcast to the conversation except sender.</summary>
    public async Task Typing(int conversationId)
    {
        var userId = Context.User!.GetUserId();
        await Clients.OthersInGroup($"conv_{conversationId}").SendAsync("UserTyping", conversationId, userId);
    }

    /// <summary>Mark a conversation as read and notify other participants.</summary>
    public async Task MarkRead(int conversationId)
    {
        var userId = Context.User!.GetUserId();
        await _chat.MarkReadAsync(conversationId, userId);
        var readAt = DateTime.UtcNow;
        await Clients.OthersInGroup($"conv_{conversationId}").SendAsync("MessagesRead", conversationId, userId, readAt);
    }

    /// <summary>Acknowledge message delivery — receiver calls this when message arrives.</summary>
    public async Task AcknowledgeDelivery(int conversationId)
    {
        var userId = Context.User!.GetUserId();
        await Clients.OthersInGroup($"conv_{conversationId}").SendAsync("MessageDelivered", conversationId, userId);
    }

    /// <summary>Join a new conversation group (called when a new conversation is created).</summary>
    public async Task JoinConversation(int conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"conv_{conversationId}");
    }

    /// <summary>Get currently online user IDs.</summary>
    public Task<List<int>> GetOnlineUsers()
    {
        lock (Lock)
        {
            return Task.FromResult(OnlineUsers.Keys.ToList());
        }
    }
}
