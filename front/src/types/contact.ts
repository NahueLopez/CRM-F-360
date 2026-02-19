export interface Contact {
    id: number;
    companyId: number;
    companyName: string;
    fullName: string;
    email?: string;
    phone?: string;
    position?: string;
    notes?: string;
    active: boolean;
    createdAt: string;
}
