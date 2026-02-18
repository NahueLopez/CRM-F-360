namespace CRMF360.Application.Reports;

public class DashboardReportDto
{
    public int TotalCompanies { get; set; }
    public int TotalProjects { get; set; }
    public int TotalTasks { get; set; }
    public int TotalUsers { get; set; }
    public decimal TotalHoursAllTime { get; set; }
    public decimal TotalHoursThisMonth { get; set; }
    public List<HoursByProjectDto> HoursByProject { get; set; } = new();
    public List<HoursByUserDto> HoursByUser { get; set; } = new();
    public List<ProjectStatusCountDto> ProjectsByStatus { get; set; } = new();
    public List<TaskPriorityCountDto> TasksByPriority { get; set; } = new();
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
