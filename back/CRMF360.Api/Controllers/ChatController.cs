using CRMF360.Api.Extensions;
using CRMF360.Application.Abstractions;
using CRMF360.Application.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chat;
    private readonly IApplicationDbContext _db;
    public ChatController(IChatService chat, IApplicationDbContext db) { _chat = chat; _db = db; }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(CancellationToken ct)
        => Ok(await _chat.GetConversationsAsync(User.GetUserId(), ct));

    [HttpPost("conversations/dm/{userId:int}")]
    public async Task<IActionResult> GetOrCreateDm(int userId, CancellationToken ct)
        => Ok(await _chat.GetOrCreateDmAsync(User.GetUserId(), userId, ct));

    [HttpPost("conversations/group")]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupDto dto, CancellationToken ct)
        => Created("", await _chat.CreateGroupAsync(User.GetUserId(), dto, ct));

    [HttpGet("conversations/{id:int}/messages")]
    public async Task<IActionResult> GetMessages(int id, [FromQuery] int take = 50, [FromQuery] int? beforeId = null, CancellationToken ct = default)
        => Ok(await _chat.GetMessagesAsync(id, User.GetUserId(), take, beforeId, ct));

    [HttpPost("conversations/{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        await _chat.MarkReadAsync(id, User.GetUserId(), ct);
        return NoContent();
    }

    [HttpGet("unread")]
    public async Task<IActionResult> GetTotalUnread(CancellationToken ct)
        => Ok(new { count = await _chat.GetTotalUnreadAsync(User.GetUserId(), ct) });

    [HttpGet("users")]
    public async Task<IActionResult> GetChatUsers(CancellationToken ct)
    {
        var users = await _db.Users.Select(u => new { u.Id, u.FullName, u.Email }).ToListAsync(ct);
        return Ok(users);
    }
}
