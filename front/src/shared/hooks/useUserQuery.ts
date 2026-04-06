import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../features/users/userService";
import type { User } from "../../features/users/types";

export const userKeys = {
    all: ["users"] as const,
    paged: (params: Record<string, any>) => ["users", "paged", params] as const,
    detail: (id: number) => ["users", id] as const,
};

export const useUsers = () =>
    useQuery({ queryKey: userKeys.all, queryFn: () => userService.getAll() });

export const useUsersPaged = (params: Record<string, any>) =>
    useQuery({
        queryKey: userKeys.paged(params),
        queryFn: () => userService.getPaged(params),
    });

export const useCreateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<User>) => userService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
};

export const useUpdateUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
            userService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
};

export const useDeleteUser = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
    });
};
