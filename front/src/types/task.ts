export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
    id: number;
    projectId: number;
    projectName: string;
    columnId?: number;
    columnName?: string;
    assigneeId?: number;
    assigneeName?: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    sortOrder: number;
    dueDate?: string;
    createdAt?: string;
}
