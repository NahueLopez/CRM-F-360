import { api } from "../lib/apiClient";
import type { DashboardReport } from "../types/report";

export const reportService = {
    getDashboard: () => api.get<DashboardReport>("/reports/dashboard"),
};
