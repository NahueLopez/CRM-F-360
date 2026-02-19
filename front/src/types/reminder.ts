export interface Reminder {
    id: number;
    userId: number;
    userName: string;
    contactId?: number;
    contactName?: string;
    companyId?: number;
    companyName?: string;
    projectId?: number;
    projectName?: string;
    title: string;
    description?: string;
    dueDate: string;
    isCompleted: boolean;
    createdAt: string;
}
