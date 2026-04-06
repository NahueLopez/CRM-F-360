import { api } from "../../shared/api/apiClient";
import type { AuditLogEntry } from "./types";

export const auditLogService = {
  getAll: (page = 1, pageSize = 50) =>
    api.get<AuditLogEntry[]>(`/audit-logs?page=${page}&pageSize=${pageSize}`),

  getPaged: (params?: Record<string, any>) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== ""),
    );
    const qs = new URLSearchParams(cleanParams as any).toString();
    return api.get<any>(`/audit-logs/paged?${qs}`);
  },

  getByEntity: (entityType: string, entityId: number) =>
    api.get<AuditLogEntry[]>(`/audit-logs/by-entity?entityType=${entityType}&entityId=${entityId}`),
};
