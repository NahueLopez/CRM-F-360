using System.Security.Claims;

namespace CRMF360.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? user.FindFirstValue("sub");

        return int.TryParse(sub, out var id) ? id : 0;
    }

    public static int GetTenantId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue("tenantId");
        return int.TryParse(claim, out var id) ? id : 0;
    }

    public static bool IsAdmin(this ClaimsPrincipal user)
        => user.IsInRole("Admin");

    public static bool IsManagerOrAdmin(this ClaimsPrincipal user)
        => user.IsInRole("Admin") || user.IsInRole("Manager");
}
