import { api } from "../lib/apiClient";
import type { TaskComment } from "../types/taskComment";

export const taskCommentService = {
    getByTask: (taskId: number) =>
        api.get<TaskComment[]>(`/tasks/${taskId}/comments`),

    create: (taskId: number, content: string) =>
        api.post<TaskComment>(`/tasks/${taskId}/comments`, { content }),

    remove: (taskId: number, id: number) =>
        api.delete(`/tasks/${taskId}/comments/${id}`),
};
