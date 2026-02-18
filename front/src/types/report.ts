export interface DashboardReport {
    totalCompanies: number;
    totalProjects: number;
    totalTasks: number;
    totalUsers: number;
    totalHoursAllTime: number;
    totalHoursThisMonth: number;
    hoursByProject: HoursByProject[];
    hoursByUser: HoursByUser[];
    projectsByStatus: StatusCount[];
    tasksByPriority: PriorityCount[];
}

export interface HoursByProject {
    projectId: number;
    projectName: string;
    companyName: string;
    totalHours: number;
    estimatedHours: number;
}

export interface HoursByUser {
    userId: number;
    userName: string;
    totalHours: number;
    hoursThisMonth: number;
}

export interface StatusCount {
    status: string;
    count: number;
}

export interface PriorityCount {
    priority: string;
    count: number;
}
