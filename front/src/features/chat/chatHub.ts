import * as signalR from "@microsoft/signalr";
import { authStore } from "../../shared/auth/authStore";
import type { ChatMessage } from "./types";

let connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
    if (connection) return connection;

    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ?? "http://localhost:5005";

    connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/hubs/chat`, {
            accessTokenFactory: () => authStore.token ?? "",
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

    return connection;
}

export async function startConnection(): Promise<void> {
    const conn = getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) return;
    if (conn.state !== signalR.HubConnectionState.Disconnected) return;

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await conn.start();
            console.log("[ChatHub] Connected");
            return;
        } catch (err) {
            console.warn(`[ChatHub] Connection attempt ${attempt}/${maxRetries} failed:`, err);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw new Error("[ChatHub] Failed to connect after " + maxRetries + " attempts");
}

export async function stopConnection(): Promise<void> {
    if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.stop();
        console.log("[ChatHub] Disconnected");
    }
}

export function onReceiveMessage(callback: (msg: ChatMessage) => void): void {
    getConnection().on("ReceiveMessage", callback);
}

export function offReceiveMessage(callback: (msg: ChatMessage) => void): void {
    getConnection().off("ReceiveMessage", callback);
}

export function onUserTyping(callback: (conversationId: number, userId: number) => void): void {
    getConnection().on("UserTyping", callback);
}

export function offUserTyping(callback: (conversationId: number, userId: number) => void): void {
    getConnection().off("UserTyping", callback);
}

export function onUserOnline(callback: (userId: number) => void): void {
    getConnection().on("UserOnline", callback);
}

export function onUserOffline(callback: (userId: number) => void): void {
    getConnection().on("UserOffline", callback);
}

export function onMessagesRead(callback: (conversationId: number, userId: number, readAt: string) => void): void {
    getConnection().on("MessagesRead", callback);
}

export function offMessagesRead(callback: (conversationId: number, userId: number, readAt: string) => void): void {
    getConnection().off("MessagesRead", callback);
}

export function onMessageDelivered(callback: (conversationId: number, userId: number) => void): void {
    getConnection().on("MessageDelivered", callback);
}

export function offMessageDelivered(callback: (conversationId: number, userId: number) => void): void {
    getConnection().off("MessageDelivered", callback);
}

export async function acknowledgeDelivery(conversationId: number): Promise<void> {
    await getConnection().invoke("AcknowledgeDelivery", conversationId);
}

export async function sendMessage(conversationId: number, content: string): Promise<void> {
    await getConnection().invoke("SendMessage", conversationId, content);
}

export async function sendTyping(conversationId: number): Promise<void> {
    await getConnection().invoke("Typing", conversationId);
}

export async function markRead(conversationId: number): Promise<void> {
    await getConnection().invoke("MarkRead", conversationId);
}

export async function joinConversation(conversationId: number): Promise<void> {
    await getConnection().invoke("JoinConversation", conversationId);
}

export async function getOnlineUsers(): Promise<number[]> {
    return await getConnection().invoke<number[]>("GetOnlineUsers");
}
