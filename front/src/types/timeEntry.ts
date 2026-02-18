export interface TimeEntry {
  id: number;
  taskId: number;
  taskTitle: string;
  userId: number;
  userName: string;
  date: string;
  hours: number;
  description?: string;
  createdAt?: string;
}