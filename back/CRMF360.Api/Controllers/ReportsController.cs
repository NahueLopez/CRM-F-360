using CRMF360.Application.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "reports.view")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
        => _reportService = reportService;

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardReportDto>> GetDashboard(CancellationToken ct)
        => Ok(await _reportService.GetDashboardReportAsync(ct));

    [HttpGet("user-performance")]
    public async Task<IActionResult> GetUserPerformance(CancellationToken ct)
        => Ok(await _reportService.GetUserPerformanceAsync(ct));

    [HttpGet("department-performance")]
    public async Task<IActionResult> GetDepartmentPerformance(CancellationToken ct)
        => Ok(await _reportService.GetDepartmentPerformanceAsync(ct));

    [HttpGet("top-clients")]
    public async Task<IActionResult> GetTopClients([FromQuery] int count = 10, CancellationToken ct = default)
        => Ok(await _reportService.GetTopClientsAsync(count, ct));

    [HttpGet("conversion-funnel")]
    public async Task<IActionResult> GetConversionFunnel(CancellationToken ct)
        => Ok(await _reportService.GetConversionFunnelAsync(ct));
}
