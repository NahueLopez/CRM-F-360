import { api } from "../../shared/api/apiClient";
import type { TimeEntry, ProjectHoursSummary } from "./types";

export const timeEntryService = {
    getAll: () => api.get<TimeEntry[]>("/time-entries"),

    getByTask: (taskId: number) =>
        api.get<TimeEntry[]>(`/time-entries/by-task/${taskId}`),

    getByUser: (userId: number) =>
        api.get<TimeEntry[]>(`/time-entries/by-user/${userId}`),

    getById: (id: number) => api.get<TimeEntry>(`/time-entries/${id}`),

    getProjectSummary: () =>
        api.get<ProjectHoursSummary[]>("/time-entries/project-summary"),

    create: (data: {
        taskId: number;
        userId: number;
        date: string;
        hours: number;
        description?: string;
    }) => api.post<TimeEntry>("/time-entries", data),

    update: (
        id: number,
        data: { date: string; hours: number; description?: string }
    ) => api.put<TimeEntry>(`/time-entries/${id}`, data),

    remove: (id: number) => api.delete(`/time-entries/${id}`),
};
