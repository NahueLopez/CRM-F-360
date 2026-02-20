export interface AuditLogEntry {
    id: number;
    userId: number;
    userName: string;
    action: string;
    entityType: string;
    entityId?: number;
    entityName?: string;
    details?: string;
    createdAt: string;
}
