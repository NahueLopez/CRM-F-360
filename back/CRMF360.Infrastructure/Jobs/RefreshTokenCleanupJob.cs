using CRMF360.Application.Abstractions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CRMF360.Infrastructure.Jobs;

/// <summary>
/// Runs every 6 hours and deletes expired or revoked refresh tokens
/// to prevent the table from growing without limit.
/// </summary>
public class RefreshTokenCleanupJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RefreshTokenCleanupJob> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

    public RefreshTokenCleanupJob(
        IServiceScopeFactory scopeFactory,
        ILogger<RefreshTokenCleanupJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RefreshTokenCleanupJob started.");

        // Wait a bit on startup
        await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error in RefreshTokenCleanupJob.");
            }

            await System.Threading.Tasks.Task.Delay(Interval, stoppingToken);
        }
    }

    private async System.Threading.Tasks.Task CleanupAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var now = DateTime.UtcNow;

        // Delete tokens that are expired OR revoked
        var deleted = await db.RefreshTokens
            .Where(rt => rt.ExpiresAt < now || rt.RevokedAt != null)
            .ExecuteDeleteAsync(ct);

        if (deleted > 0)
            _logger.LogInformation("RefreshTokenCleanupJob removed {Count} expired/revoked tokens.", deleted);
    }
}
