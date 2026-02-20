export type DealStage = 'Lead' | 'Contacted' | 'Proposal' | 'Negotiation' | 'ClosedWon' | 'ClosedLost';

export interface Deal {
    id: number;
    title: string;
    companyId?: number;
    companyName?: string;
    contactId?: number;
    contactName?: string;
    assignedToId: number;
    assignedToName: string;
    stage: DealStage;
    value?: number;
    currency?: string;
    notes?: string;
    expectedCloseDate?: string;
    sortOrder: number;
    createdAt: string;
}

export interface PipelineSummary {
    stage: string;
    count: number;
    totalValue: number;
}
