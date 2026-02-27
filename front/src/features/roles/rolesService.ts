import { api } from "../../shared/api/apiClient";

export interface Permission {
    id: number;
    name: string;
    description: string | null;
    module: string;
}

export interface RoleWithPermissions {
    id: number;
    name: string;
    permissions: string[];
}

export const permissionsApi = {
    getAll: () => api.get<Permission[]>("/permissions"),
};

export const rolesApi = {
    getAll: () => api.get<RoleWithPermissions[]>("/roles"),
    create: (name: string) => api.post<RoleWithPermissions>("/roles", { name }),
    update: (id: number, data: { name: string; permissionIds?: number[] }) =>
        api.put<void>(`/roles/${id}`, data),
    delete: (id: number) => api.delete(`/roles/${id}`),
};
