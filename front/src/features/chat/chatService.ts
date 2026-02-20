import { api } from "../../shared/api/apiClient";
import type { Conversation, ChatMessage } from "./types";

export const chatService = {
    getConversations: () =>
        api.get<Conversation[]>("/chat/conversations"),

    getOrCreateDm: (userId: number) =>
        api.post<Conversation>(`/chat/conversations/dm/${userId}`, {}),

    createGroup: (name: string, memberIds: number[]) =>
        api.post<Conversation>("/chat/conversations/group", { name, memberIds }),

    getMessages: (conversationId: number, take = 50, beforeId?: number) => {
        const params = new URLSearchParams({ take: String(take) });
        if (beforeId) params.append("beforeId", String(beforeId));
        return api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages?${params}`);
    },

    markRead: (conversationId: number) =>
        api.post<void>(`/chat/conversations/${conversationId}/read`, {}),

    getTotalUnread: () =>
        api.get<{ count: number }>("/chat/unread"),

    getUsers: () =>
        api.get<{ id: number; fullName: string; email: string }[]>("/chat/users"),
};
