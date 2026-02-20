import { api } from "../../shared/api/apiClient";
import type { Task } from "./types";

export const taskService = {
    getAll: () => api.get<Task[]>("/tasks"),

    getByProject: (projectId: number) =>
        api.get<Task[]>(`/tasks/by-project/${projectId}`),

    getById: (id: number) => api.get<Task>(`/tasks/${id}`),

    create: (data: {
        projectId: number;
        columnId?: number;
        assigneeId?: number;
        title: string;
        description?: string;
        priority?: string;
        dueDate?: string;
    }) => api.post<Task>("/tasks", data),

    update: (
        id: number,
        data: {
            columnId?: number;
            assigneeId?: number;
            title: string;
            description?: string;
            priority: string;
            dueDate?: string;
        }
    ) => api.put<Task>(`/tasks/${id}`, data),

    move: (id: number, columnId: number, sortOrder: number) =>
        api.patch<void>(`/tasks/${id}/move`, { columnId, sortOrder }),

    remove: (id: number) => api.delete(`/tasks/${id}`),
};
