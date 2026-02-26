import { useQuery } from "@tanstack/react-query";
import { reportService } from "../../features/reports/reportService";

export const dashboardKeys = {
    all: ["dashboard"] as const,
};

/** Fetches the full dashboard report — cached for 2 minutes */
export const useDashboard = () =>
    useQuery({
        queryKey: dashboardKeys.all,
        queryFn: () => reportService.getDashboard(),
        staleTime: 2 * 60_000, // 2 min — dashboard data doesn't change fast
    });
