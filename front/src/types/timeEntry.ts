export interface TimeEntry {
  id: number;
  taskId: number;
  taskTitle: string;
  projectName: string;
  userId: number;
  userName: string;
  date: string;
  hours: number;
  description?: string;
  createdAt?: string;
}

export interface ProjectHoursSummary {
  projectId: number;
  projectName: string;
  companyName: string;
  status: string;
  estimatedHours: number;
  loggedHours: number;
  deltaHours: number;
  burnPercent: number;
  totalEntries: number;
}
