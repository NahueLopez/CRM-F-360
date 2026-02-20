import { api } from "../../shared/api/apiClient";
import type { Deal, PipelineSummary } from "./types";

export const dealService = {
    getAll: () => api.get<Deal[]>("/deals"),
    getByStage: (stage: string) => api.get<Deal[]>(`/deals/stage/${stage}`),
    getSummary: () => api.get<PipelineSummary[]>("/deals/summary"),
    getById: (id: number) => api.get<Deal>(`/deals/${id}`),
    create: (data: {
        title: string;
        companyId?: number;
        contactId?: number;
        assignedToId?: number;
        stage?: string;
        value?: number;
        currency?: string;
        notes?: string;
        expectedCloseDate?: string;
    }) => api.post<Deal>("/deals", data),
    update: (id: number, data: {
        title: string;
        companyId?: number;
        contactId?: number;
        assignedToId?: number;
        value?: number;
        currency?: string;
        notes?: string;
        expectedCloseDate?: string;
    }) => api.put(`/deals/${id}`, data),
    move: (id: number, stage: string, sortOrder: number) =>
        api.put(`/deals/${id}/move`, { stage, sortOrder }),
    remove: (id: number) => api.delete(`/deals/${id}`),
};
