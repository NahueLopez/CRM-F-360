import { api } from "../../shared/api/apiClient";
import type { ActivityLog } from "./types";

export const activityService = {
    getByCompany: (companyId: number) =>
        api.get<ActivityLog[]>(`/activities/by-company/${companyId}`),

    getByContact: (contactId: number) =>
        api.get<ActivityLog[]>(`/activities/by-contact/${contactId}`),

    getByProject: (projectId: number) =>
        api.get<ActivityLog[]>(`/activities/by-project/${projectId}`),

    getRecent: (count = 20) =>
        api.get<ActivityLog[]>(`/activities/recent?count=${count}`),

    create: (data: {
        companyId?: number;
        contactId?: number;
        projectId?: number;
        type: string;
        description: string;
    }) => api.post<ActivityLog>("/activities", data),

    remove: (id: number) => api.delete(`/activities/${id}`),
};
