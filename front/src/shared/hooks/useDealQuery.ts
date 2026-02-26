import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dealService } from "../../features/pipeline/dealService";
import type { Deal } from "../../features/pipeline/types";

export const dealKeys = {
    all: ["deals"] as const,
    summary: ["deals", "summary"] as const,
};

export const useDeals = () =>
    useQuery({ queryKey: dealKeys.all, queryFn: () => dealService.getAll() });

export const useDealSummary = () =>
    useQuery({ queryKey: dealKeys.summary, queryFn: () => dealService.getSummary() });

export const useCreateDeal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof dealService.create>[0]) =>
            dealService.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: dealKeys.all });
            qc.invalidateQueries({ queryKey: dealKeys.summary });
        },
    });
};

export const useUpdateDeal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Parameters<typeof dealService.update>[1] }) =>
            dealService.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: dealKeys.all });
            qc.invalidateQueries({ queryKey: dealKeys.summary });
        },
    });
};

export const useMoveDeal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, stage, sortOrder }: { id: number; stage: string; sortOrder: number }) =>
            dealService.move(id, stage, sortOrder),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: dealKeys.all });
            qc.invalidateQueries({ queryKey: dealKeys.summary });
        },
    });
};

export const useDeleteDeal = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => dealService.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: dealKeys.all });
            qc.invalidateQueries({ queryKey: dealKeys.summary });
        },
    });
};

/** Optimistic setter — used by Pipeline DnD to update local cache instantly */
export const useSetDealsCache = () => {
    const qc = useQueryClient();
    return (updater: (prev: Deal[]) => Deal[]) => {
        qc.setQueryData<Deal[]>(dealKeys.all, (old) => old ? updater(old) : []);
    };
};
