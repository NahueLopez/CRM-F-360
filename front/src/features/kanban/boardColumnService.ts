import { api } from "../../shared/api/apiClient";
import type { BoardColumn } from "./types";

export const boardColumnService = {
    getByProject: (projectId: number) =>
        api.get<BoardColumn[]>(`/projects/${projectId}/columns`),

    create: (projectId: number, name: string) =>
        api.post<BoardColumn>(`/projects/${projectId}/columns`, {
            projectId,
            name,
        }),

    update: (projectId: number, id: number, name: string, sortOrder: number) =>
        api.put<void>(`/projects/${projectId}/columns/${id}`, { name, sortOrder }),

    remove: (projectId: number, id: number) =>
        api.delete(`/projects/${projectId}/columns/${id}`),
};
