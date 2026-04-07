using System.ComponentModel.DataAnnotations;

namespace CRMF360.Application.Workspaces;

public class WorkspaceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Plan { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateWorkspaceDto
{
    [Required][MaxLength(100)] public string Name { get; set; } = null!;
    [Required][MaxLength(100)] public string Slug { get; set; } = null!;
    [MaxLength(50)] public string? Plan { get; set; } = "Free";
}

public class UpdateWorkspaceDto
{
    [Required][MaxLength(100)] public string Name { get; set; } = null!;
    [Required][MaxLength(100)] public string Slug { get; set; } = null!;
    public string? Plan { get; set; }
    public bool Active { get; set; }
}

public class WorkspaceUserDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public bool Active { get; set; }
    
    // El rol que tiene este usuario en ESTE workspace específico
    public int? RoleId { get; set; }
    public string? RoleName { get; set; }
}

public class AssignWorkspaceUserDto
{
    [Required] public int UserId { get; set; }
    [Required] public int RoleId { get; set; }
}
