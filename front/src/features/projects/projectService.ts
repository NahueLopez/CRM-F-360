import { api } from "../../shared/api/apiClient";
import type { Project } from "./types";

export const projectService = {
  getAll: () => api.get<Project[]>("/projects"),

  getPaged: (params?: Record<string, any>) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== ""),
    );
    const qs = new URLSearchParams(cleanParams as any).toString();
    return api.get<any>(`/projects/paged?${qs}`);
  },

  getById: (id: number) => api.get<Project>(`/projects/${id}`),

  create: (data: Partial<Project>) => api.post<Project>("/projects", data),

  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),

  remove: (id: number) => api.delete(`/projects/${id}`),
};
