namespace CRMF360.Application.Rooms;

// ── Response DTOs ──

public class RoomDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Location { get; set; }
    public int Capacity { get; set; }
    public List<string> Amenities { get; set; } = [];
    public string? Description { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Current status: true if there's an active reservation right now</summary>
    public bool IsOccupied { get; set; }

    /// <summary>Current reservation title (if occupied)</summary>
    public string? CurrentReservationTitle { get; set; }
}

public class RoomReservationDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string RoomName { get; set; } = null!;
    public string? RoomColor { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string Title { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── Request DTOs ──

public class CreateRoomDto
{
    public string Name { get; set; } = null!;
    public string? Location { get; set; }
    public int Capacity { get; set; } = 1;
    public List<string>? Amenities { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
}

public class UpdateRoomDto
{
    public string Name { get; set; } = null!;
    public string? Location { get; set; }
    public int Capacity { get; set; } = 1;
    public List<string>? Amenities { get; set; }
    public string? Description { get; set; }
    public string? Color { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateReservationDto
{
    public int RoomId { get; set; }
    public string Title { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Notes { get; set; }
}
