import { api } from "../../shared/api/apiClient";
import type { TaskComment } from "./commentTypes";

export const taskCommentService = {
    getByTask: (taskId: number) =>
        api.get<TaskComment[]>(`/tasks/${taskId}/comments`),

    create: (taskId: number, content: string) =>
        api.post<TaskComment>(`/tasks/${taskId}/comments`, { content }),

    remove: (taskId: number, id: number) =>
        api.delete(`/tasks/${taskId}/comments/${id}`),
};
