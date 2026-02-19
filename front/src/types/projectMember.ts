export interface ProjectMember {
    id: number;
    projectId: number;
    userId: number;
    userName: string;
    userEmail: string;
    role: string;
    canManageTasks: boolean;
    canManageMembers: boolean;
    canManageBoard: boolean;
    canEditProject: boolean;
    joinedAt: string;
}
