namespace CRMF360.Application.Roles;

public class UpdateRoleDto
{
    public string Name { get; set; } = null!;
    public List<int>? PermissionIds { get; set; }
}
