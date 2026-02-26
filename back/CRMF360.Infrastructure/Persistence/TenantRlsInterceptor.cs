using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;
using System.Security.Claims;

namespace CRMF360.Infrastructure.Persistence;

/// <summary>
/// EF interceptor that sets the PostgreSQL session variable 'app.current_tenant_id'
/// on every connection open. This enables Row Level Security (RLS) policies
/// to enforce tenant isolation at the database level.
/// </summary>
public sealed class TenantRlsInterceptor : DbConnectionInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantRlsInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override async ValueTask<InterceptionResult> ConnectionOpeningAsync(
        DbConnection connection,
        ConnectionEventData eventData,
        InterceptionResult result,
        CancellationToken cancellationToken = default)
    {
        // Open the connection first
        var res = await base.ConnectionOpeningAsync(connection, eventData, result, cancellationToken);
        return res;
    }

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await SetTenantAsync(connection, cancellationToken);
        await base.ConnectionOpenedAsync(connection, eventData, cancellationToken);
    }

    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        SetTenantAsync(connection, CancellationToken.None).GetAwaiter().GetResult();
        base.ConnectionOpened(connection, eventData);
    }

    private async Task SetTenantAsync(DbConnection connection, CancellationToken ct)
    {
        var tenantId = _httpContextAccessor.HttpContext?.User?.FindFirstValue("tenantId");
        if (string.IsNullOrEmpty(tenantId)) return;

        await using var cmd = connection.CreateCommand();
        cmd.CommandText = $"SET LOCAL app.current_tenant_id = '{tenantId}'";
        await cmd.ExecuteNonQueryAsync(ct);
    }
}
