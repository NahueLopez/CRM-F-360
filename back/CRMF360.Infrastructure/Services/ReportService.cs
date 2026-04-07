using CRMF360.Application.Abstractions;
using CRMF360.Application.Reports;
using Microsoft.EntityFrameworkCore;

namespace CRMF360.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _db;

    public ReportService(IApplicationDbContext db) => _db = db;

    public async Task<DashboardReportDto> GetDashboardReportAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // Sequential queries — DbContext is NOT thread-safe, cannot use Task.WhenAll
        var totalCompanies = await _db.Companies.CountAsync(ct);
        var totalProjects = await _db.Projects.CountAsync(ct);
        var totalTasks = await _db.Tasks.CountAsync(ct);
        var totalUsers = await _db.Users.CountAsync(ct);
        var totalContacts = await _db.Contacts.CountAsync(ct);
        var overdueTasks = await _db.Tasks.CountAsync(t => t.DueDate < now, ct);
        var totalHoursAllTime = await _db.TimeEntries.SumAsync(e => e.Hours, ct);
        var totalHoursThisMonth = await _db.TimeEntries
            .Where(e => e.Date >= monthStart)
            .SumAsync(e => e.Hours, ct);

        // Hours by project — SQL GroupBy
        var hoursByProject = await _db.TimeEntries
            .AsNoTracking()
            .GroupBy(e => new
            {
                e.Task.ProjectId,
                ProjectName = e.Task.Project.Name,
                CompanyName = e.Task.Project.Company.Name,
                EstimatedHours = e.Task.Project.EstimatedHours ?? 0m,
            })
            .Select(g => new HoursByProjectDto
            {
                ProjectId = g.Key.ProjectId,
                ProjectName = g.Key.ProjectName,
                CompanyName = g.Key.CompanyName,
                TotalHours = g.Sum(e => e.Hours),
                EstimatedHours = g.Key.EstimatedHours,
            })
            .OrderByDescending(x => x.TotalHours)
            .Take(10)
            .ToListAsync(ct);

        // Hours by user — SQL GroupBy
        var hoursByUser = await _db.TimeEntries
            .AsNoTracking()
            .GroupBy(e => new { e.UserId, UserName = e.User.FullName })
            .Select(g => new HoursByUserDto
            {
                UserId = g.Key.UserId,
                UserName = g.Key.UserName,
                TotalHours = g.Sum(e => e.Hours),
                HoursThisMonth = g.Where(e => e.Date >= monthStart).Sum(e => e.Hours),
            })
            .OrderByDescending(x => x.TotalHours)
            .Take(10)
            .ToListAsync(ct);

        // Projects by status — SQL GroupBy
        var projectsByStatus = await _db.Projects
            .AsNoTracking()
            .GroupBy(p => p.Status)
            .Select(g => new ProjectStatusCountDto
            {
                Status = g.Key.ToString(),
                Count = g.Count(),
            })
            .ToListAsync(ct);

        // Tasks by priority — SQL GroupBy
        var tasksByPriority = await _db.Tasks
            .AsNoTracking()
            .GroupBy(t => t.Priority)
            .Select(g => new TaskPriorityCountDto
            {
                Priority = g.Key.ToString(),
                Count = g.Count(),
            })
            .ToListAsync(ct);

        // ─── Project Health — optimized: single query with subquery aggregations ───
        var projectHealth = await _db.Projects.AsNoTracking()
            .Select(p => new ProjectHealthDto
            {
                ProjectId = p.Id,
                ProjectName = p.Name,
                Status = p.Status.ToString(),
                TotalTasks = p.Tasks.Count,
                CompletedTasks = p.Tasks.Count(t =>
                    t.Column != null && t.Column.SortOrder == _db.BoardColumns
                        .Where(bc => bc.ProjectId == p.Id)
                        .Max(bc => (int?)bc.SortOrder)),
                OverdueTasks = p.Tasks.Count(t => t.DueDate.HasValue && t.DueDate < now),
                EstimatedHours = p.EstimatedHours ?? 0m,
                LoggedHours = p.Tasks.SelectMany(t => t.TimeEntries).Sum(te => te.Hours),
                HoursBurnPercent = (p.EstimatedHours ?? 0m) > 0
                    ? Math.Round(
                        p.Tasks.SelectMany(t => t.TimeEntries).Sum(te => te.Hours)
                        / (p.EstimatedHours ?? 1m) * 100, 1)
                    : 0,
            })
            .Where(h => h.TotalTasks > 0)
            .OrderByDescending(h => h.HoursBurnPercent)
            .Take(10)
            .ToListAsync(ct);

        // ─── Recent Activity ───
        var recent = await _db.ActivityLogs.AsNoTracking()
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new RecentActivityDto
            {
                Id = a.Id,
                Type = a.Type,
                Description = a.Description,
                UserName = a.User.FullName,
                EntityName = a.Company != null ? a.Company.Name
                           : a.Contact != null ? a.Contact.FullName
                           : a.Project != null ? a.Project.Name
                           : null,
                CreatedAt = a.CreatedAt,
            })
            .ToListAsync(ct);

        // ─── Pipeline / Deals ───
        var totalDeals = await _db.Deals.CountAsync(ct);
        var pipelineTotal = await _db.Deals
            .Where(d => d.Stage != Domain.Entities.DealStage.ClosedLost)
            .SumAsync(d => d.Value ?? 0, ct);

        var dealsByStage = await _db.Deals.AsNoTracking()
            .GroupBy(d => d.Stage)
            .Select(g => new DealStageCountDto
            {
                Stage = g.Key.ToString(),
                Count = g.Count(),
                TotalValue = g.Sum(d => d.Value ?? 0),
            })
            .ToListAsync(ct);

        // ─── Overdue Reminders ───
        var overdueReminders = await _db.Reminders
            .CountAsync(r => !r.IsCompleted && r.DueDate < now, ct);

        return new DashboardReportDto
        {
            TotalCompanies = totalCompanies,
            TotalProjects = totalProjects,
            TotalTasks = totalTasks,
            TotalUsers = totalUsers,
            TotalContacts = totalContacts,
            TotalHoursAllTime = totalHoursAllTime,
            TotalHoursThisMonth = totalHoursThisMonth,
            OverdueTasks = overdueTasks,
            PipelineTotalValue = pipelineTotal,
            TotalDeals = totalDeals,
            OverdueReminders = overdueReminders,
            DealsByStage = dealsByStage,
            HoursByProject = hoursByProject,
            HoursByUser = hoursByUser,
            ProjectsByStatus = projectsByStatus,
            TasksByPriority = tasksByPriority,
            ProjectHealth = projectHealth,
            RecentActivity = recent,
        };
    }

    public async Task<List<UserPerformanceDto>> GetUserPerformanceAsync(CancellationToken ct = default)
    {
        var users = await _db.Users.AsNoTracking()
            .Include(u => u.Department)
            .Where(u => u.Active)
            .ToListAsync(ct);

        var result = new List<UserPerformanceDto>();
        foreach (var u in users)
        {
            var dealsWon = await _db.Deals.CountAsync(d => d.AssignedToId == u.Id && d.Stage == Domain.Entities.DealStage.ClosedWon, ct);
            var dealsValue = await _db.Deals.Where(d => d.AssignedToId == u.Id && d.Stage == Domain.Entities.DealStage.ClosedWon).SumAsync(d => d.Value ?? 0, ct);
            var activities = await _db.ActivityLogs.CountAsync(a => a.UserId == u.Id, ct);
            var hours = await _db.TimeEntries.Where(t => t.UserId == u.Id).SumAsync(t => t.Hours, ct);

            result.Add(new UserPerformanceDto
            {
                UserId = u.Id,
                UserName = u.FullName,
                DepartmentName = u.Department?.Name,
                DealsWon = dealsWon,
                DealsTotalValue = dealsValue,
                ActivitiesCount = activities,
                HoursLogged = hours
            });
        }
        return result.OrderByDescending(u => u.DealsTotalValue).ToList();
    }

    public async Task<List<DepartmentPerformanceDto>> GetDepartmentPerformanceAsync(CancellationToken ct = default)
    {
        var departments = await _db.Departments.AsNoTracking()
            .Include(d => d.Users)
            .ToListAsync(ct);

        var result = new List<DepartmentPerformanceDto>();
        foreach (var d in departments)
        {
            var userIds = d.Users.Select(u => u.Id).ToList();
            var dealsWon = await _db.Deals.CountAsync(de => de.AssignedToId.HasValue && userIds.Contains(de.AssignedToId.Value) && de.Stage == Domain.Entities.DealStage.ClosedWon, ct);
            var dealsValue = await _db.Deals.Where(de => de.AssignedToId.HasValue && userIds.Contains(de.AssignedToId.Value) && de.Stage == Domain.Entities.DealStage.ClosedWon).SumAsync(de => de.Value ?? 0, ct);
            var activities = await _db.ActivityLogs.CountAsync(a => userIds.Contains(a.UserId), ct);
            var hours = await _db.TimeEntries.Where(t => userIds.Contains(t.UserId)).SumAsync(t => t.Hours, ct);

            result.Add(new DepartmentPerformanceDto
            {
                DepartmentId = d.Id,
                DepartmentName = d.Name,
                UserCount = d.Users.Count,
                DealsWon = dealsWon,
                DealsTotalValue = dealsValue,
                ActivitiesCount = activities,
                HoursLogged = hours
            });
        }
        return result.OrderByDescending(d => d.DealsTotalValue).ToList();
    }

    public async Task<List<TopClientDto>> GetTopClientsAsync(int count = 10, CancellationToken ct = default)
    {
        return await _db.Companies.AsNoTracking()
            .Select(c => new TopClientDto
            {
                CompanyId = c.Id,
                CompanyName = c.Name,
                DealsCount = _db.Deals.Count(d => d.CompanyId == c.Id && d.Stage == Domain.Entities.DealStage.ClosedWon),
                TotalValue = _db.Deals.Where(d => d.CompanyId == c.Id && d.Stage == Domain.Entities.DealStage.ClosedWon).Sum(d => d.Value ?? 0),
                ContactsCount = c.Contacts.Count
            })
            .OrderByDescending(c => c.TotalValue)
            .Take(count)
            .ToListAsync(ct);
    }

    public async Task<ConversionFunnelDto> GetConversionFunnelAsync(CancellationToken ct = default)
    {
        var stages = await _db.Deals.AsNoTracking()
            .GroupBy(d => d.Stage)
            .Select(g => new { Stage = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var totalDeals = stages.Sum(s => s.Count);
        var closedWon = stages.FirstOrDefault(s => s.Stage == Domain.Entities.DealStage.ClosedWon)?.Count ?? 0;
        var closedLost = stages.FirstOrDefault(s => s.Stage == Domain.Entities.DealStage.ClosedLost)?.Count ?? 0;
        var avgValue = totalDeals > 0
            ? await _db.Deals.Where(d => d.Stage == Domain.Entities.DealStage.ClosedWon).AverageAsync(d => d.Value ?? 0, ct)
            : 0;

        return new ConversionFunnelDto
        {
            TotalLeads = stages.FirstOrDefault(s => s.Stage == Domain.Entities.DealStage.Lead)?.Count ?? 0,
            ContactedLeads = stages.FirstOrDefault(s => s.Stage == Domain.Entities.DealStage.Contacted)?.Count ?? 0,
            ProposalsSent = stages.FirstOrDefault(s => s.Stage == Domain.Entities.DealStage.Proposal)?.Count ?? 0,
            Negotiations = stages.FirstOrDefault(s => s.Stage == Domain.Entities.DealStage.Negotiation)?.Count ?? 0,
            ClosedWon = closedWon,
            ClosedLost = closedLost,
            ConversionRate = totalDeals > 0 ? Math.Round((decimal)closedWon / totalDeals * 100, 1) : 0,
            AverageDealValue = avgValue
        };
    }
}
