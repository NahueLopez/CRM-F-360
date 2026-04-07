namespace CRMF360.Application.Reports;

public class DashboardReportDto
{
    // Counts
    public int TotalCompanies { get; set; }
    public int TotalProjects { get; set; }
    public int TotalTasks { get; set; }
    public int TotalUsers { get; set; }
    public int TotalContacts { get; set; }

    // Hours
    public decimal TotalHoursAllTime { get; set; }
    public decimal TotalHoursThisMonth { get; set; }

    // Overdue tasks
    public int OverdueTasks { get; set; }

    // Pipeline
    public decimal PipelineTotalValue { get; set; }
    public int TotalDeals { get; set; }
    public int OverdueReminders { get; set; }
    public List<DealStageCountDto> DealsByStage { get; set; } = new();

    // Breakdowns
    public List<HoursByProjectDto> HoursByProject { get; set; } = new();
    public List<HoursByUserDto> HoursByUser { get; set; } = new();
    public List<ProjectStatusCountDto> ProjectsByStatus { get; set; } = new();
    public List<TaskPriorityCountDto> TasksByPriority { get; set; } = new();
    public List<ProjectHealthDto> ProjectHealth { get; set; } = new();
    public List<RecentActivityDto> RecentActivity { get; set; } = new();
}

public class HoursByProjectDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string CompanyName { get; set; } = null!;
    public decimal TotalHours { get; set; }
    public decimal EstimatedHours { get; set; }
}

public class HoursByUserDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public decimal TotalHours { get; set; }
    public decimal HoursThisMonth { get; set; }
}

public class ProjectStatusCountDto
{
    public string Status { get; set; } = null!;
    public int Count { get; set; }
}

public class TaskPriorityCountDto
{
    public string Priority { get; set; } = null!;
    public int Count { get; set; }
}

public class ProjectHealthDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = null!;
    public string Status { get; set; } = null!;
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int OverdueTasks { get; set; }
    public decimal EstimatedHours { get; set; }
    public decimal LoggedHours { get; set; }
    /// <summary>Percentage 0..100</summary>
    public decimal HoursBurnPercent { get; set; }
}

public class RecentActivityDto
{
    public int Id { get; set; }
    public string Type { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public string? EntityName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DealStageCountDto
{
    public string Stage { get; set; } = null!;
    public int Count { get; set; }
    public decimal TotalValue { get; set; }
}

public class UserPerformanceDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string? DepartmentName { get; set; }
    public int DealsWon { get; set; }
    public decimal DealsTotalValue { get; set; }
    public int LeadsGenerated { get; set; }
    public int ActivitiesCount { get; set; }
    public int TasksCompleted { get; set; }
    public decimal HoursLogged { get; set; }
}

public class DepartmentPerformanceDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = null!;
    public int UserCount { get; set; }
    public int DealsWon { get; set; }
    public decimal DealsTotalValue { get; set; }
    public int ActivitiesCount { get; set; }
    public decimal HoursLogged { get; set; }
}

public class TopClientDto
{
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = null!;
    public int DealsCount { get; set; }
    public decimal TotalValue { get; set; }
    public int ContactsCount { get; set; }
}

public class ConversionFunnelDto
{
    public int TotalLeads { get; set; }
    public int ContactedLeads { get; set; }
    public int ProposalsSent { get; set; }
    public int Negotiations { get; set; }
    public int ClosedWon { get; set; }
    public int ClosedLost { get; set; }
    public decimal ConversionRate { get; set; } // ClosedWon / TotalLeads * 100
    public decimal AverageDealValue { get; set; }
}
