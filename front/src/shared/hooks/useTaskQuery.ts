import { useQuery } from "@tanstack/react-query";
import { taskService } from "../../features/tasks/taskService";

export const taskKeys = {
    all: ["tasks"] as const,
    paged: (params: Record<string, any>) => ["tasks", "paged", params] as const,
    byProject: (projectId: number) => ["tasks", "project", projectId] as const,
    detail: (id: number) => ["tasks", "detail", id] as const,
};

export const useTasks = () =>
    useQuery({ queryKey: taskKeys.all, queryFn: () => taskService.getAll() });

export const useTasksPaged = (params: Record<string, any>) =>
    useQuery({
        queryKey: taskKeys.paged(params),
        queryFn: () => taskService.getPaged(params),
    });

export const useProjectTasks = (projectId: number) =>
    useQuery({
        queryKey: taskKeys.byProject(projectId),
        queryFn: () => taskService.getByProject(projectId),
        enabled: projectId > 0,
    });
