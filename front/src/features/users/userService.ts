import { api } from "../../shared/api/apiClient";
import type { User } from "./types";

export const userService = {
  getAll: () => api.get<User[]>("/users"),

  getPaged: (params?: Record<string, any>) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
    );
    const qs = new URLSearchParams(cleanParams as any).toString();
    return api.get<any>(`/users/paged?${qs}`);
  },

  getById: (id: number) => api.get<User>(`/users/${id}`),

  create: (data: Partial<User>) => api.post<User>("/users", data),

  update: (id: number, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),

  remove: (id: number) => api.delete(`/users/${id}`),
};
