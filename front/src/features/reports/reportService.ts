import { api } from "../../shared/api/apiClient";
import type { DashboardReport } from "./types";

export const reportService = {
    getDashboard: () => api.get<DashboardReport>("/reports/dashboard"),
};
