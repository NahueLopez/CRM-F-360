import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../../features/projects/projectService";
import type { Project } from "../../features/projects/types";

export const projectKeys = {
    all: ["projects"] as const,
    detail: (id: number) => ["projects", id] as const,
};

export const useProjects = () =>
    useQuery({ queryKey: projectKeys.all, queryFn: () => projectService.getAll() });

export const useProject = (id: number) =>
    useQuery({
        queryKey: projectKeys.detail(id),
        queryFn: () => projectService.getById(id),
        enabled: id > 0,
    });

export const useCreateProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Project>) => projectService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    });
};

export const useUpdateProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) =>
            projectService.update(id, data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: projectKeys.all });
            qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
        },
    });
};

export const useDeleteProject = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => projectService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    });
};
