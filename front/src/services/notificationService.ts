import { api } from "../lib/apiClient";
import type { Notification } from "../types/notification";

export const notificationService = {
    getMine: () => api.get<Notification[]>("/notifications"),
    getUnreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
    markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put("/notifications/read-all"),
    remove: (id: number) => api.delete(`/notifications/${id}`),
};
