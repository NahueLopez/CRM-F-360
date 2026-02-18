import { api } from "../lib/apiClient";
import type { Project } from "../types/project";

export const projectService = {
  getAll: () => api.get<Project[]>("/projects"),

  getById: (id: number) => api.get<Project>(`/projects/${id}`),

  create: (data: Partial<Project>) => api.post<Project>("/projects", data),

  update: (id: number, data: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, data),

  remove: (id: number) => api.delete(`/projects/${id}`),
};
