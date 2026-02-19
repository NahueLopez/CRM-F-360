namespace CRMF360.Domain.Entities;

public class ActivityLog
{
    public int Id { get; set; }

    // Polymorphic: can be linked to Company, Contact, or Project
    public int? CompanyId { get; set; }
    public int? ContactId { get; set; }
    public int? ProjectId { get; set; }

    public int UserId { get; set; }

    /// <summary>Call, Meeting, Email, Note, StatusChange</summary>
    public string Type { get; set; } = "Note";

    public string Description { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Company? Company { get; set; }
    public Contact? Contact { get; set; }
    public Project? Project { get; set; }
    public User User { get; set; } = null!;
}
