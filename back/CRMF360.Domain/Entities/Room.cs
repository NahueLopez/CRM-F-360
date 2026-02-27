namespace CRMF360.Domain.Entities;

public class Room : ISoftDeletable, ITenantEntity
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = null!;
    public string? Location { get; set; }
    public int Capacity { get; set; } = 1;

    /// <summary>JSON array of amenity names, e.g. ["Proyector","TV","Pizarra"]</summary>
    public string? Amenities { get; set; }

    public string? Description { get; set; }

    /// <summary>Hex color for calendar display, e.g. "#818cf8"</summary>
    public string? Color { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public ICollection<RoomReservation> Reservations { get; set; } = new List<RoomReservation>();
}
