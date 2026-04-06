import { api } from "../../shared/api/apiClient";
import type { Company } from "./types";

export const companyService = {
  getAll: () => api.get<Company[]>("/companies"),

  getPaged: (params?: Record<string, any>) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
    );
    const qs = new URLSearchParams(cleanParams as any).toString();
    return api.get<any>(`/companies/paged?${qs}`);
  },

  getById: (id: number) => api.get<Company>(`/companies/${id}`),

  create: (data: Partial<Company>) => api.post<Company>("/companies", data),

  update: (id: number, data: Partial<Company>) =>
    api.put<Company>(`/companies/${id}`, data),

  remove: (id: number) => api.delete(`/companies/${id}`),
};
