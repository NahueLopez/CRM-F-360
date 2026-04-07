using CRMF360.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Api.Authorization;

/// <summary>
/// Custom authorization requirement that checks if the user's role(s) have
/// a specific permission in the RolePermissions table.
/// Usage: [Authorize(Policy = "companies.create")]
/// </summary>
public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }
    public PermissionRequirement(string permission) => Permission = permission;
}

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;

    public PermissionAuthorizationHandler(IServiceScopeFactory scopeFactory)
        => _scopeFactory = scopeFactory;

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var userId = context.User.FindFirst("id")?.Value;
        if (userId is null) return;

        // SuperAdmin bypasses all permission checks
        var isSuperAdmin = context.User.FindFirst("isSuperAdmin")?.Value;
        if (isSuperAdmin == "true")
        {
            context.Succeed(requirement);
            return;
        }

        // Admin role bypasses all permission checks (within their tenant)
        if (context.User.IsInRole("Admin"))
        {
            context.Succeed(requirement);
            return;
        }

        // Get current tenant from JWT
        var tenantIdClaim = context.User.FindFirst("tenantId")?.Value;
        int? tenantId = int.TryParse(tenantIdClaim, out var tid) ? tid : null;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var query = db.UserRoles
            .Where(ur => ur.UserId == int.Parse(userId));

        // Scope to current tenant if available
        if (tenantId.HasValue)
            query = query.Where(ur => ur.TenantId == tenantId.Value);

        var hasPermission = await query
            .SelectMany(ur => ur.Role.RolePermissions)
            .AnyAsync(rp => rp.Permission.Name == requirement.Permission);

        if (hasPermission)
            context.Succeed(requirement);
    }
}
