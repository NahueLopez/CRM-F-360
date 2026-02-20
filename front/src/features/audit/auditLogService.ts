import { api } from "../../shared/api/apiClient";
import type { AuditLogEntry } from "./types";

export const auditLogService = {
    getAll: (page = 1, pageSize = 50) =>
        api.get<AuditLogEntry[]>(`/audit-logs?page=${page}&pageSize=${pageSize}`),
    getByEntity: (entityType: string, entityId: number) =>
        api.get<AuditLogEntry[]>(`/audit-logs/by-entity?entityType=${entityType}&entityId=${entityId}`),
};
