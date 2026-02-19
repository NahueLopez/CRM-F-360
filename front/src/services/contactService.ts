import { api } from "../lib/apiClient";
import type { Contact } from "../types/contact";

export const contactService = {
    getAll: () => api.get<Contact[]>("/contacts"),

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
