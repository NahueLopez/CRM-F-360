export type ProjectStatus = "Planned" | "InProgress" | "Paused" | "Done";

export interface Project {
  id: number;
  companyId: number;
  companyName: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDateEstimated?: string;
  estimatedHours?: number;
  createdAt?: string;
  taskCount: number;
}
