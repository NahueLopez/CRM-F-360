using System.Text.Json;
using CRMF360.Application.Abstractions;
using CRMF360.Application.Rooms;
using CRMF360.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class RoomService : IRoomService
{
    private readonly IApplicationDbContext _db;

    public RoomService(IApplicationDbContext db) => _db = db;

    // ══════════════════════════════════════════════════
    //  ROOMS CRUD
    // ══════════════════════════════════════════════════

    public async Task<List<RoomDto>> GetAllRoomsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var rooms = await _db.Rooms
            .AsNoTracking()
            .Include(r => r.Reservations)
            .Where(r => r.IsActive)
            .OrderBy(r => r.Name)
            .ToListAsync(ct);

        return rooms.Select(r =>
        {
            var dto = MapToDto(r, now);
            var current = r.Reservations.FirstOrDefault(res => res.StartTime <= now && res.EndTime > now);
            dto.IsOccupied = current != null;
            dto.CurrentReservationTitle = current?.Title;
            return dto;
        }).ToList();
    }

    public async Task<RoomDto?> GetRoomByIdAsync(int id, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var entity = await _db.Rooms
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (entity is null) return null;

        return MapToDto(entity, now);
    }

    public async Task<RoomDto> CreateRoomAsync(CreateRoomDto dto, CancellationToken ct = default)
    {
        var entity = new Room
        {
            Name = dto.Name,
            Location = dto.Location,
            Capacity = dto.Capacity,
            Amenities = dto.Amenities != null ? JsonSerializer.Serialize(dto.Amenities) : null,
            Description = dto.Description,
            Color = dto.Color,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Rooms.Add(entity);
        await _db.SaveChangesAsync(ct);

        return MapToDto(entity, DateTime.UtcNow);
    }

    public async Task<bool> UpdateRoomAsync(int id, UpdateRoomDto dto, CancellationToken ct = default)
    {
        var entity = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity is null) return false;

        entity.Name = dto.Name;
        entity.Location = dto.Location;
        entity.Capacity = dto.Capacity;
        entity.Amenities = dto.Amenities != null ? JsonSerializer.Serialize(dto.Amenities) : null;
        entity.Description = dto.Description;
        entity.Color = dto.Color;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteRoomAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity is null) return false;

        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ══════════════════════════════════════════════════
    //  RESERVATIONS
    // ══════════════════════════════════════════════════

    public async Task<List<RoomReservationDto>> GetReservationsAsync(
        int? roomId, DateTime date, CancellationToken ct = default)
    {
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);

        var query = _db.RoomReservations
            .AsNoTracking()
            .Include(r => r.Room)
            .Include(r => r.User)
            .Where(r => r.StartTime < dayEnd && r.EndTime > dayStart);

        if (roomId.HasValue)
            query = query.Where(r => r.RoomId == roomId.Value);

        return await query
            .OrderBy(r => r.StartTime)
            .Select(r => new RoomReservationDto
            {
                Id = r.Id,
                RoomId = r.RoomId,
                RoomName = r.Room.Name,
                RoomColor = r.Room.Color,
                UserId = r.UserId,
                UserName = r.User.FullName,
                Title = r.Title,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                Notes = r.Notes,
                CreatedAt = r.CreatedAt,
            })
            .ToListAsync(ct);
    }

    public async Task<RoomReservationDto> CreateReservationAsync(
        CreateReservationDto dto, int userId, CancellationToken ct = default)
    {
        // Validate: no overlap with existing reservations
        var hasOverlap = await _db.RoomReservations
            .AnyAsync(r =>
                r.RoomId == dto.RoomId &&
                r.StartTime < dto.EndTime &&
                r.EndTime > dto.StartTime,
                ct);

        if (hasOverlap)
            throw new InvalidOperationException(
                "La sala ya está reservada en ese horario. Elegí otra franja.");

        var room = await _db.Rooms.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == dto.RoomId, ct)
            ?? throw new KeyNotFoundException("Sala no encontrada");

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new KeyNotFoundException("Usuario no encontrado");

        var entity = new RoomReservation
        {
            RoomId = dto.RoomId,
            UserId = userId,
            Title = dto.Title,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
        };

        _db.RoomReservations.Add(entity);
        await _db.SaveChangesAsync(ct);

        return new RoomReservationDto
        {
            Id = entity.Id,
            RoomId = entity.RoomId,
            RoomName = room.Name,
            RoomColor = room.Color,
            UserId = userId,
            UserName = user.FullName,
            Title = entity.Title,
            StartTime = entity.StartTime,
            EndTime = entity.EndTime,
            Notes = entity.Notes,
            CreatedAt = entity.CreatedAt,
        };
    }

    public async Task<bool> DeleteReservationAsync(int id, int userId, bool isAdmin, CancellationToken ct = default)
    {
        var entity = await _db.RoomReservations.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity is null) return false;

        // Only the creator or an Admin can cancel
        if (entity.UserId != userId && !isAdmin) return false;

        _db.RoomReservations.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ══════════════════════════════════════════════════
    //  MAPPING
    // ══════════════════════════════════════════════════

    private static RoomDto MapToDto(Room r, DateTime now) => new()
    {
        Id = r.Id,
        Name = r.Name,
        Location = r.Location,
        Capacity = r.Capacity,
        Amenities = r.Amenities != null
            ? JsonSerializer.Deserialize<List<string>>(r.Amenities) ?? new()
            : new(),
        Description = r.Description,
        Color = r.Color,
        IsActive = r.IsActive,
        CreatedAt = r.CreatedAt,
    };
}
