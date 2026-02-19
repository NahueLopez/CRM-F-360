export interface ActivityLog {
    id: number;
    companyId?: number;
    companyName?: string;
    contactId?: number;
    contactName?: string;
    projectId?: number;
    projectName?: string;
    userId: number;
    userName: string;
    type: string;
    description: string;
    createdAt: string;
}
