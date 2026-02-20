import { api } from "../../shared/api/apiClient";
import type { ProjectMember } from "./memberTypes";

export const projectMemberService = {
    getByProject: (projectId: number) =>
        api.get<ProjectMember[]>(`/projects/${projectId}/members`),

    add: (projectId: number, userId: number, role: string = "Member") =>
        api.post<ProjectMember>(`/projects/${projectId}/members`, { userId, role }),

    updateRole: (projectId: number, userId: number, role: string) =>
        api.put(`/projects/${projectId}/members/${userId}`, { role }),

    remove: (projectId: number, userId: number) =>
        api.delete(`/projects/${projectId}/members/${userId}`),
};
