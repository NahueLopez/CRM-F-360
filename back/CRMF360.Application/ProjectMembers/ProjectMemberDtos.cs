using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.ProjectMembers;

public class ProjectMemberDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string UserEmail { get; set; } = null!;
    public string Role { get; set; } = null!;
    public bool CanManageTasks { get; set; }
    public bool CanManageMembers { get; set; }
    public bool CanManageBoard { get; set; }
    public bool CanEditProject { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class AddProjectMemberDto
{
    [Required]
    public int UserId { get; set; }

    [MaxLength(50)]
    public string Role { get; set; } = "Member";

    public bool CanManageTasks { get; set; } = true;
    public bool CanManageMembers { get; set; }
    public bool CanManageBoard { get; set; }
    public bool CanEditProject { get; set; }
}

public class UpdateProjectMemberDto
{
    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = "Member";

    public bool CanManageTasks { get; set; } = true;
    public bool CanManageMembers { get; set; }
    public bool CanManageBoard { get; set; }
    public bool CanEditProject { get; set; }
}
