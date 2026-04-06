import React from "react";
import type { AuditLogEntry } from "./types";
import { usePagination } from "../../shared/hooks/usePagination";
import Pagination from "../../shared/ui/Pagination";
import { useAuditLogsPaged } from "../../shared/hooks/useAuditLogQuery";
import { useUsers } from "../../shared/hooks/useUserQuery";

const ACTION_COLORS: Record<string, string> = {
  Create: "text-emerald-400 bg-emerald-500/10",
  Update: "text-sky-400 bg-sky-500/10",
  Delete: "text-red-400 bg-red-500/10",
  Login: "text-violet-400 bg-violet-500/10",
  Logout: "text-slate-400 bg-slate-500/10",
};

const ENTITY_ICONS: Record<string, string> = {
  Company: "🏢",
  Contact: "👤",
  Project: "📁",
  Task: "✅",
  Deal: "💰",
  User: "👥",
  TimeEntry: "⏱",
  Reminder: "⏰",
};

const AuditLogsPage: React.FC = () => {
  const { page, pageSize, search, handleSearch, params, setPage, setPageSize } = usePagination();
  const [actionFilter, setActionFilter] = React.useState<string>("");
  const [entityFilter, setEntityFilter] = React.useState<string>("");
  const [userFilter, setUserFilter] = React.useState<string>("");

  // Prepare custom params including filters
  const auditParams = React.useMemo(() => {
    const p: any = { ...params };
    if (actionFilter) p.action = actionFilter;
    if (entityFilter) p.entityType = entityFilter;
    if (userFilter) p.userId = userFilter;
    return p;
  }, [params, actionFilter, entityFilter, userFilter]);

  const { data, isLoading: loading } = useAuditLogsPaged(auditParams);
  const { data: usersData } = useUsers();

  const logs = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-slate-400">Registro de todas las acciones del sistema</p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Todos los usuarios</option>
            {usersData?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Cualquier entidad</option>
            {Object.keys(ENTITY_ICONS).map((entity) => (
              <option key={entity} value={entity}>
                {ENTITY_ICONS[entity]} {entity}
              </option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Todas las acciones</option>
            {Object.keys(ACTION_COLORS).map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar detalle, nombre..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">No hay registros de auditoría</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Fecha</th>
                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Usuario</th>
                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Acción</th>
                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Entidad</th>
                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Nombre</th>
                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: AuditLogEntry) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-700/30 hover:bg-slate-700/20 transition"
                >
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{log.userName}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? "text-slate-400 bg-slate-500/10"}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className="mr-1">{ENTITY_ICONS[log.entityType] ?? "📄"}</span>
                    {log.entityType}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-300">{log.entityName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">
                    {log.details ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onChangePage={setPage}
          onChangePageSize={setPageSize}
        />
      )}
    </div>
  );
};

export default AuditLogsPage;
