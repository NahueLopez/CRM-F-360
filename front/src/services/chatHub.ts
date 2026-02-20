import * as signalR from "@microsoft/signalr";
import { authStore } from "../auth/authStore";
import type { ChatMessage } from "../types/chat";

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
    if (conn.state === signalR.HubConnectionState.Disconnected) {
        await conn.start();
        console.log("[ChatHub] Connected");
    }
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
