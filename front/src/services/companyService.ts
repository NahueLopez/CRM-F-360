import { api } from "../lib/apiClient";
import type { Company } from "../types/company";

export const companyService = {
  getAll: () => api.get<Company[]>("/companies"),

  getById: (id: number) => api.get<Company>(`/companies/${id}`),

  create: (data: Partial<Company>) => api.post<Company>("/companies", data),

  update: (id: number, data: Partial<Company>) =>
    api.put<Company>(`/companies/${id}`, data),

  remove: (id: number) => api.delete(`/companies/${id}`),
};
