import { useEffect } from "react";
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
    mutationFn: (data: Parameters<typeof dealService.create>[0]) => dealService.create(data),
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
    onMutate: async ({ id, stage, sortOrder }) => {
      await qc.cancelQueries({ queryKey: dealKeys.all });
      const previousDeals = qc.getQueryData<Deal[]>(dealKeys.all);

      // Optimistic: update both stage AND sortOrder in the cache
      if (previousDeals) {
        qc.setQueryData<Deal[]>(dealKeys.all, (old) => {
          if (!old) return [];
          return old.map((d) =>
            d.id === id ? { ...d, stage: stage as Deal["stage"], sortOrder } : d,
          );
        });
      }
      return { previousDeals };
    },
    onError: (_err, _newDeal, context) => {
      if (context?.previousDeals) {
        qc.setQueryData(dealKeys.all, context.previousDeals);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.summary });
      // Refetch deals after a short delay to sync with server-sorted data
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: dealKeys.all });
      }, 1000);
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
    qc.setQueryData<Deal[]>(dealKeys.all, (old) => (old ? updater(old) : []));
  };
};

/**
 * Hook that connects to the Pipeline SignalR hub and keeps the
 * React-Query deal cache in sync in real time across all clients.
 */
export const usePipelineWebSockets = () => {
  const qc = useQueryClient();

  useEffect(() => {
    let stopped = false;

    const setup = async () => {
      // Dynamic import to avoid loading SignalR on pages that don't need it
      const { getPipelineConnection, startPipelineConnection, stopPipelineConnection } =
        await import("../../features/pipeline/pipelineHub");

      if (stopped) return;

      const conn = getPipelineConnection();

      // ── Event handlers ──
      conn.on("DealCreated", (deal: Deal) => {
        qc.setQueryData<Deal[]>(dealKeys.all, (old) => {
          if (!old) return [deal];
          // Avoid duplicates
          if (old.some((d) => d.id === deal.id)) return old;
          return [...old, deal];
        });
        qc.invalidateQueries({ queryKey: dealKeys.summary });
      });

      conn.on("DealUpdated", (deal: Deal) => {
        qc.setQueryData<Deal[]>(dealKeys.all, (old) => {
          if (!old) return [];
          return old.map((d) => (d.id === deal.id ? deal : d));
        });
        qc.invalidateQueries({ queryKey: dealKeys.summary });
      });

      conn.on("DealMoved", (id: number, stage: string, sortOrder: number) => {
        qc.setQueryData<Deal[]>(dealKeys.all, (old) => {
          if (!old) return [];
          return old.map((d) =>
            d.id === id ? { ...d, stage: stage as Deal["stage"], sortOrder } : d,
          );
        });
        qc.invalidateQueries({ queryKey: dealKeys.summary });
      });

      conn.on("DealDeleted", (id: number) => {
        qc.setQueryData<Deal[]>(dealKeys.all, (old) => {
          if (!old) return [];
          return old.filter((d) => d.id !== id);
        });
        qc.invalidateQueries({ queryKey: dealKeys.summary });
      });

      try {
        await startPipelineConnection();
      } catch {
        console.warn("[usePipelineWebSockets] Could not connect — falling back to polling");
      }

      // Cleanup function
      return async () => {
        conn.off("DealCreated");
        conn.off("DealUpdated");
        conn.off("DealMoved");
        conn.off("DealDeleted");
        await stopPipelineConnection();
      };
    };

    let cleanup: (() => Promise<void>) | undefined;
    setup().then((fn) => {
      cleanup = fn;
    });

    return () => {
      stopped = true;
      cleanup?.();
    };
  }, [qc]);
};
