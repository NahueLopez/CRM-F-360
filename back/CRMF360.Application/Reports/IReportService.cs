namespace CRMF360.Application.Reports;

public interface IReportService
{
    Task<DashboardReportDto> GetDashboardReportAsync(CancellationToken ct = default);
}
