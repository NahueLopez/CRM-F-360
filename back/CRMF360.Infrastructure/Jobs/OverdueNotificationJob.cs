using CRMF360.Application.Abstractions;
using CRMF360.Application.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CRMF360.Infrastructure.Jobs;

/// <summary>
/// Runs every hour, checks for overdue tasks and reminders, and creates
/// notifications for the relevant users. Skips items that already have
/// an active (unread) overdue notification to avoid duplicates.
/// </summary>
public class OverdueNotificationJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OverdueNotificationJob> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    public OverdueNotificationJob(
        IServiceScopeFactory scopeFactory,
        ILogger<OverdueNotificationJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OverdueNotificationJob started.");

        // Wait a short time on startup to let the app finish initializing
        await System.Threading.Tasks.Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckOverdueItemsAsync(stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error in OverdueNotificationJob.");
            }

            await System.Threading.Tasks.Task.Delay(Interval, stoppingToken);
        }
    }

    private async System.Threading.Tasks.Task CheckOverdueItemsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;
        var createdCount = 0;

        // ─── Overdue Tasks ───────────────────────────────────────────────
        var overdueTasks = await db.Tasks
            .Include(t => t.Project)
            .Where(t => t.DueDate.HasValue && t.DueDate < now && t.AssigneeId.HasValue)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.AssigneeId,
                ProjectName = t.Project.Name,
            })
            .ToListAsync(ct);

        // Get existing unread TaskOverdue notifications to avoid duplicates
        var existingTaskNotifs = await db.Notifications
            .Where(n => n.Type == "TaskOverdue" && !n.IsRead && n.RelatedEntityType == "Task")
            .Select(n => n.RelatedEntityId)
            .ToListAsync(ct);

        var existingTaskIds = new HashSet<int?>(existingTaskNotifs);

        foreach (var task in overdueTasks)
        {
            if (existingTaskIds.Contains(task.Id)) continue;

            await notifService.CreateAsync(
                userId: task.AssigneeId!.Value,
                type: "TaskOverdue",
                title: $"Tarea vencida: {task.Title}",
                message: $"La tarea \"{task.Title}\" del proyecto {task.ProjectName} está vencida.",
                relatedEntityType: "Task",
                relatedEntityId: task.Id,
                ct: ct);

            createdCount++;
        }

        // ─── Overdue Reminders ───────────────────────────────────────────
        var overdueReminders = await db.Reminders
            .Where(r => r.DueDate < now && !r.IsCompleted)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.UserId,
            })
            .ToListAsync(ct);

        var existingReminderNotifs = await db.Notifications
            .Where(n => n.Type == "ReminderDue" && !n.IsRead && n.RelatedEntityType == "Reminder")
            .Select(n => n.RelatedEntityId)
            .ToListAsync(ct);

        var existingReminderIds = new HashSet<int?>(existingReminderNotifs);

        foreach (var reminder in overdueReminders)
        {
            if (existingReminderIds.Contains(reminder.Id)) continue;

            await notifService.CreateAsync(
                userId: reminder.UserId,
                type: "ReminderDue",
                title: $"Recordatorio vencido: {reminder.Title}",
                message: $"El recordatorio \"{reminder.Title}\" ya pasó su fecha.",
                relatedEntityType: "Reminder",
                relatedEntityId: reminder.Id,
                ct: ct);

            createdCount++;
        }

        if (createdCount > 0)
            _logger.LogInformation("OverdueNotificationJob created {Count} notifications.", createdCount);
    }
}
