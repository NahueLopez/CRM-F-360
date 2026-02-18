import { api } from "../lib/apiClient";
import type { User } from "../types/user";

export const userService = {
  getAll: () => api.get<User[]>("/users"),

  getById: (id: number) => api.get<User>(`/users/${id}`),

  create: (data: Partial<User>) => api.post<User>("/users", data),

  update: (id: number, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),

  remove: (id: number) => api.delete(`/users/${id}`),
};
