namespace CRMF360.Application.Reports;

public interface IReportService
{
    Task<DashboardReportDto> GetDashboardReportAsync(CancellationToken ct = default);
    Task<List<UserPerformanceDto>> GetUserPerformanceAsync(CancellationToken ct = default);
    Task<List<DepartmentPerformanceDto>> GetDepartmentPerformanceAsync(CancellationToken ct = default);
    Task<List<TopClientDto>> GetTopClientsAsync(int count = 10, CancellationToken ct = default);
    Task<ConversionFunnelDto> GetConversionFunnelAsync(CancellationToken ct = default);
}
