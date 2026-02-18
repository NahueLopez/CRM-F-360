using CRMF360.Application.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
        => _reportService = reportService;

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardReportDto>> GetDashboard(CancellationToken ct)
        => Ok(await _reportService.GetDashboardReportAsync(ct));
}
