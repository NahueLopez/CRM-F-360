using CRMF360.Api.Extensions;
using CRMF360.Application.Rooms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
        => _roomService = roomService;

    // ══════════════════════════════════════════════════
    //  ROOMS CRUD (Admin/Manager only for mutations)
    // ══════════════════════════════════════════════════

    [HttpGet]
    [Authorize(Policy = "rooms.view")]
    public async Task<ActionResult<List<RoomDto>>> GetAll(CancellationToken ct)
        => Ok(await _roomService.GetAllRoomsAsync(ct));

    [HttpGet("{id:int}")]
    [Authorize(Policy = "rooms.view")]
    public async Task<ActionResult<RoomDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await _roomService.GetRoomByIdAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    [Authorize(Policy = "rooms.create")]
    public async Task<ActionResult<RoomDto>> Create(CreateRoomDto body, CancellationToken ct)
    {
        var dto = await _roomService.CreateRoomAsync(body, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "rooms.edit")]
    public async Task<IActionResult> Update(int id, UpdateRoomDto body, CancellationToken ct)
        => await _roomService.UpdateRoomAsync(id, body, ct) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "rooms.delete")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
        => await _roomService.DeleteRoomAsync(id, ct) ? NoContent() : NotFound();

    // ══════════════════════════════════════════════════
    //  RESERVATIONS (all authenticated users)
    // ══════════════════════════════════════════════════

    [HttpGet("reservations")]
    [Authorize(Policy = "rooms.view")]
    public async Task<ActionResult<List<RoomReservationDto>>> GetReservations(
        [FromQuery] int? roomId, [FromQuery] DateTime? date, CancellationToken ct)
    {
        var targetDate = date ?? DateTime.UtcNow;
        return Ok(await _roomService.GetReservationsAsync(roomId, targetDate, ct));
    }

    [HttpPost("reservations")]
    [Authorize(Policy = "rooms.reserve")]
    public async Task<ActionResult<RoomReservationDto>> CreateReservation(
        CreateReservationDto body, CancellationToken ct)
    {
        try
        {
            var dto = await _roomService.CreateReservationAsync(body, User.GetUserId(), ct);
            return Created("", dto);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("reservations/{id:int}")]
    public async Task<IActionResult> DeleteReservation(int id, CancellationToken ct)
    {
        var isAdmin = User.IsManagerOrAdmin();
        var result = await _roomService.DeleteReservationAsync(id, User.GetUserId(), isAdmin, ct);
        return result ? NoContent() : NotFound();
    }
}
