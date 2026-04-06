import { api } from "../../shared/api/apiClient";
import type { Contact } from "./types";

export const contactService = {
    getAll: () => api.get<Contact[]>("/contacts"),

    getPaged: (params?: Record<string, any>) => {
        const cleanParams = Object.fromEntries(
            Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
        );
        const qs = new URLSearchParams(cleanParams as any).toString();
        return api.get<any>(`/contacts/paged?${qs}`);
    },

    getByCompany: (companyId: number) =>
        api.get<Contact[]>(`/contacts/by-company/${companyId}`),

    getById: (id: number) => api.get<Contact>(`/contacts/${id}`),

    create: (data: {
        companyId: number;
        fullName: string;
        email?: string;
        phone?: string;
        position?: string;
        notes?: string;
    }) => api.post<Contact>("/contacts", data),

    update: (
        id: number,
        data: {
            fullName: string;
            email?: string;
            phone?: string;
            position?: string;
            notes?: string;
            active?: boolean;
        }
    ) => api.put<Contact>(`/contacts/${id}`, data),

    remove: (id: number) => api.delete(`/contacts/${id}`),
};
