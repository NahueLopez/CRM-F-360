using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CRMF360.Infrastructure.Hubs;

/// <summary>
/// Real-time Pipeline hub. The backend broadcasts deal mutations through
/// IHubContext&lt;PipelineHub&gt; — no client-invoked methods needed.
/// </summary>
[Authorize]
public class PipelineHub : Hub
{
    public override Task OnConnectedAsync()
    {
        // All authenticated users automatically receive pipeline broadcasts
        return base.OnConnectedAsync();
    }
}
