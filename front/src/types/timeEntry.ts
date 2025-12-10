export interface TimeEntry {
    id: number;
    projectId: number;
    userId: number;
    date: string; // ISO
    hours: number;
    description?: string;
  }
  