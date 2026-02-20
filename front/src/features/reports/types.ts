export interface DashboardReport {
    totalCompanies: number;
    totalProjects: number;
    totalTasks: number;
    totalUsers: number;
    totalContacts: number;
    totalHoursAllTime: number;
    totalHoursThisMonth: number;
    overdueTasks: number;
    hoursByProject: HoursByProject[];
    hoursByUser: HoursByUser[];
    projectsByStatus: StatusCount[];
    tasksByPriority: PriorityCount[];
    projectHealth: ProjectHealth[];
    recentActivity: RecentActivity[];
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

export interface ProjectHealth {
    projectId: number;
    projectName: string;
    status: string;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    estimatedHours: number;
    loggedHours: number;
    hoursBurnPercent: number;
}

export interface RecentActivity {
    id: number;
    type: string;
    description: string;
    userName: string;
    entityName?: string;
    createdAt: string;
}
