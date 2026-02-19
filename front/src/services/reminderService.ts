import { api } from "../lib/apiClient";
import type { Reminder } from "../types/reminder";

export const reminderService = {
    getMine: () => api.get<Reminder[]>("/reminders"),
    getPending: () => api.get<Reminder[]>("/reminders/pending"),
    getOverdue: () => api.get<Reminder[]>("/reminders/overdue"),
    create: (data: {
        title: string;
        description?: string;
        dueDate: string;
        contactId?: number;
        companyId?: number;
        projectId?: number;
    }) => api.post<Reminder>("/reminders", data),
    toggleComplete: (id: number) => api.put(`/reminders/${id}/toggle`),
    remove: (id: number) => api.delete(`/reminders/${id}`),
};
