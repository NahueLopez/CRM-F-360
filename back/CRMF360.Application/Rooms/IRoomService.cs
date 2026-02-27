namespace CRMF360.Application.Rooms;

public interface IRoomService
{
    // ── Rooms CRUD ──
    Task<List<RoomDto>> GetAllRoomsAsync(CancellationToken ct = default);
    Task<RoomDto?> GetRoomByIdAsync(int id, CancellationToken ct = default);
    Task<RoomDto> CreateRoomAsync(CreateRoomDto dto, CancellationToken ct = default);
    Task<bool> UpdateRoomAsync(int id, UpdateRoomDto dto, CancellationToken ct = default);
    Task<bool> DeleteRoomAsync(int id, CancellationToken ct = default);

    // ── Reservations ──
    Task<List<RoomReservationDto>> GetReservationsAsync(int? roomId, DateTime date, CancellationToken ct = default);
    Task<RoomReservationDto> CreateReservationAsync(CreateReservationDto dto, int userId, CancellationToken ct = default);
    Task<bool> DeleteReservationAsync(int id, int userId, bool isAdmin, CancellationToken ct = default);
}
