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

        var totalCompanies = await _db.Companies.CountAsync(ct);
        var totalProjects = await _db.Projects.CountAsync(ct);
        var totalTasks = await _db.Tasks.CountAsync(ct);
        var totalUsers = await _db.Users.CountAsync(ct);

        var allEntries = await _db.TimeEntries
            .AsNoTracking()
            .Include(te => te.Task)
                .ThenInclude(t => t.Project)
                    .ThenInclude(p => p.Company)
            .Include(te => te.User)
            .ToListAsync(ct);

        var totalHoursAllTime = allEntries.Sum(e => e.Hours);
        var totalHoursThisMonth = allEntries
            .Where(e => e.Date >= monthStart)
            .Sum(e => e.Hours);

        // Hours by project
        var hoursByProject = allEntries
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
            .ToList();

        // Hours by user
        var hoursByUser = allEntries
            .GroupBy(e => new { e.UserId, UserName = e.User.FullName })
            .Select(g => new HoursByUserDto
            {
                UserId = g.Key.UserId,
                UserName = g.Key.UserName,
                TotalHours = g.Sum(e => e.Hours),
                HoursThisMonth = g.Where(e => e.Date >= monthStart).Sum(e => e.Hours),
            })
            .OrderByDescending(x => x.TotalHours)
            .ToList();

        // Projects by status
        var projectsByStatus = await _db.Projects
            .AsNoTracking()
            .GroupBy(p => p.Status)
            .Select(g => new ProjectStatusCountDto
            {
                Status = g.Key.ToString(),
                Count = g.Count(),
            })
            .ToListAsync(ct);

        // Tasks by priority
        var tasksByPriority = await _db.Tasks
            .AsNoTracking()
            .GroupBy(t => t.Priority)
            .Select(g => new TaskPriorityCountDto
            {
                Priority = g.Key.ToString(),
                Count = g.Count(),
            })
            .ToListAsync(ct);

        return new DashboardReportDto
        {
            TotalCompanies = totalCompanies,
            TotalProjects = totalProjects,
            TotalTasks = totalTasks,
            TotalUsers = totalUsers,
            TotalHoursAllTime = totalHoursAllTime,
            TotalHoursThisMonth = totalHoursThisMonth,
            HoursByProject = hoursByProject,
            HoursByUser = hoursByUser,
            ProjectsByStatus = projectsByStatus,
            TasksByPriority = tasksByPriority,
        };
    }
}
