export interface Notification {
    id: number;
    userId: number;
    type: string;
    title: string;
    message?: string;
    isRead: boolean;
    relatedEntityType?: string;
    relatedEntityId?: number;
    createdAt: string;
}
