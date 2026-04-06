import * as signalR from "@microsoft/signalr";
import { authStore } from "../../shared/auth/authStore";

let connection: signalR.HubConnection | null = null;

export function getPipelineConnection(): signalR.HubConnection {
  if (connection) return connection;

  const baseUrl =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, "") ?? "http://localhost:5005";

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/pipeline`, {
      accessTokenFactory: () => authStore.token ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
}

export async function startPipelineConnection(): Promise<void> {
  const conn = getPipelineConnection();
  if (conn.state === signalR.HubConnectionState.Connected) return;
  if (conn.state !== signalR.HubConnectionState.Disconnected) return;

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await conn.start();
      console.log("[PipelineHub] Connected");
      return;
    } catch (err) {
      console.warn(`[PipelineHub] Connection attempt ${attempt}/${maxRetries} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  console.error("[PipelineHub] Failed to connect after " + maxRetries + " attempts");
}

export async function stopPipelineConnection(): Promise<void> {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.stop();
    console.log("[PipelineHub] Disconnected");
  }
}
