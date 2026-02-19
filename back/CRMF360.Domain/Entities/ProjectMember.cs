namespace CRMF360.Domain.Entities;

public class ProjectMember
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int UserId { get; set; }

    /// <summary>Owner, Lead, Member, Viewer</summary>
    public string Role { get; set; } = "Member";

    // Granular permissions
    public bool CanManageTasks { get; set; } = true;
    public bool CanManageMembers { get; set; }
    public bool CanManageBoard { get; set; }
    public bool CanEditProject { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
}
