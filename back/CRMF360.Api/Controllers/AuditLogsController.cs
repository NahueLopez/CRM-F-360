using CRMF360.Application.AuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CRMF360.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Policy = "audit.view")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _svc;
    public AuditLogsController(IAuditLogService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(await _svc.GetAllAsync(page, pageSize, ct));

    [HttpGet("by-entity")]
    public async Task<IActionResult> GetByEntity([FromQuery] string entityType, [FromQuery] int entityId, CancellationToken ct = default)
        => Ok(await _svc.GetByEntityAsync(entityType, entityId, ct));
}
