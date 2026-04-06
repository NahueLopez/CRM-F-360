import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "../../features/audit/auditLogService";
import type { PaginationParams, PagedResult } from "./usePagination";
import type { AuditLogEntry } from "../../features/audit/types";

export const useAuditLogsPaged = (params?: PaginationParams) => {
  return useQuery<PagedResult<AuditLogEntry>, Error>({
    queryKey: ["auditLogs", "paged", params],
    queryFn: () => auditLogService.getPaged(params),
    placeholderData: (prev) => prev, // Keep previous data while fetching
  });
};
