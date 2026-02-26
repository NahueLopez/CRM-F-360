namespace CRMF360.Domain.Entities;

/// <summary>
/// Represents a granular permission (e.g., "companies.create", "deals.delete").
/// Format: {module}.{action}
/// </summary>
public class Permission
{
    public int Id { get; set; }

    /// <summary>e.g. "companies.create", "deals.view", "users.manage"</summary>
    public string Name { get; set; } = null!;

    /// <summary>Human-readable description</summary>
    public string? Description { get; set; }

    /// <summary>Module group: Companies, Contacts, Deals, Projects, Users, Reports</summary>
    public string Module { get; set; } = null!;

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
