import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/apiClient";

export interface Workspace {
    id: number;
    name: string;
    slug: string;
    plan: string;
    active: boolean;
    createdAt: string;
}

export interface WorkspaceUser {
    userId: number;
    fullName: string;
    email: string;
    active: boolean;
    roleId: number;
    roleName: string;
}

const KEYS = {
    all: ["workspaces"] as const,
    users: (id: number) => ["workspaces", id, "users"] as const,
};

export const workspacesApi = {
    getAll: async () => {
        return await api.get<Workspace[]>("/workspaces");
    },
    create: async (data: { name: string; slug: string; plan: string }) => {
        return await api.post<Workspace>("/workspaces", data);
    },
    update: async (id: number, data: { name: string; slug: string; plan: string; active: boolean }) => {
        return await api.put<Workspace>(`/workspaces/${id}`, data);
    },
    getUsers: async (id: number) => {
        return await api.get<WorkspaceUser[]>(`/workspaces/${id}/users`);
    },
    assignUser: async (id: number, data: { userId: number; roleId: number }) => {
        return await api.post(`/workspaces/${id}/users`, data);
    },
    removeUser: async (id: number, userId: number) => {
        await api.delete(`/workspaces/${id}/users/${userId}`);
    },
};

// Hooks

export function useWorkspaces() {
    return useQuery({
        queryKey: KEYS.all,
        queryFn: workspacesApi.getAll,
    });
}

export function useCreateWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: workspacesApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
    });
}

export function useUpdateWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Parameters<typeof workspacesApi.update>[1] }) =>
            workspacesApi.update(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
    });
}

export function useWorkspaceUsers(tenantId: number) {
    return useQuery({
        queryKey: KEYS.users(tenantId),
        queryFn: () => workspacesApi.getUsers(tenantId),
        enabled: !!tenantId,
    });
}

export function useAssignWorkspaceUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantId, ...data }: { tenantId: number; userId: number; roleId: number }) =>
            workspacesApi.assignUser(tenantId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: KEYS.users(variables.tenantId) });
        },
    });
}

export function useRemoveWorkspaceUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tenantId, userId }: { tenantId: number; userId: number }) =>
            workspacesApi.removeUser(tenantId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: KEYS.users(variables.tenantId) });
        },
    });
}
