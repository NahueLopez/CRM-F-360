import React, { useEffect, useState, useMemo } from "react";
import type { Task, TaskPriority } from "./types";
import type { User } from "../users/types";
import { taskService } from "./taskService";
import { userService } from "../users/userService";
import { downloadCsvFromData } from "../../shared/utils/exportService";
import { useToast } from "../../shared/context/ToastContext";

type ViewMode = "list" | "grouped";
type GroupBy = "project" | "priority" | "assignee";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; order: number }> = {
  Urgent: { label: "🔴 Urgente", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", order: 0 },
  High: { label: "🟠 Alta", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", order: 1 },
  Medium: { label: "🔵 Media", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30", order: 2 },
  Low: { label: "⚪ Baja", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", order: 3 },
};

const TasksPage: React.FC = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "">("");
  const [filterAssignee, setFilterAssignee] = useState<number | "">("");
  const [filterOverdue, setFilterOverdue] = useState(false);

  // View options
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [groupBy, setGroupBy] = useState<GroupBy>("project");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [t, u] = await Promise.all([
          taskService.getAll(),
          userService.getAll(),
        ]);
        setTasks(t);
        setUsers(u);
      } catch (err) {
        console.error(err);
        addToast("error", "Error al cargar tareas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const isOverdue = (t: Task) => t.dueDate && new Date(t.dueDate) < new Date();

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !(t.projectName ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterAssignee && t.assigneeId !== filterAssignee) return false;
      if (filterOverdue && !isOverdue(t)) return false;
      return true;
    });
  }, [tasks, search, filterPriority, filterAssignee, filterOverdue]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    overdue: tasks.filter(isOverdue).length,
    urgent: tasks.filter(t => t.priority === "Urgent").length,
    unassigned: tasks.filter(t => !t.assigneeId).length,
  }), [tasks]);

  // Grouped data
  const grouped = useMemo(() => {
    const groups: Record<string, { label: string; tasks: Task[] }> = {};
    for (const t of filtered) {
      let key: string;
      let label: string;
      if (groupBy === "project") {
        key = String(t.projectId);
        label = t.projectName || "Sin proyecto";
      } else if (groupBy === "priority") {
        key = t.priority;
        label = PRIORITY_CONFIG[t.priority]?.label ?? t.priority;
      } else {
        key = String(t.assigneeId ?? "unassigned");
        label = t.assigneeName ?? "Sin asignar";
      }
      if (!groups[key]) groups[key] = { label, tasks: [] };
      groups[key].tasks.push(t);
    }
    // Sort groups
    const entries = Object.entries(groups);
    if (groupBy === "priority") {
      entries.sort(([a], [b]) => (PRIORITY_CONFIG[a]?.order ?? 99) - (PRIORITY_CONFIG[b]?.order ?? 99));
    } else {
      entries.sort(([, a], [, b]) => b.tasks.length - a.tasks.length);
    }
    return entries;
  }, [filtered, groupBy]);

  const handleExport = () => {
    downloadCsvFromData(filtered, [
      { key: "title", header: "Título" },
      { key: "projectName", header: "Proyecto" },
      { key: "priority", header: "Prioridad" },
      { key: "assigneeName", header: "Asignado" },
      { key: "dueDate", header: "Vencimiento" },
      { key: "columnName", header: "Columna" },
    ], `tareas_${new Date().toISOString().slice(0, 10)}.csv`);
    addToast("success", `${filtered.length} tareas exportadas`);
  };

  const activeFilters = [filterPriority, filterAssignee, filterOverdue, search].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Tareas</h3>
          <p className="text-sm text-slate-400">
            Vista global de todas las tareas del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-slate-300 transition disabled:opacity-40"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
          📋 <strong className="text-white">{stats.total}</strong> total
        </span>
        <button
          onClick={() => setFilterOverdue(!filterOverdue)}
          className={`px-3 py-1.5 rounded-lg text-xs transition ${filterOverdue ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800"}`}
        >
          ⚠️ <strong className={stats.overdue > 0 ? "text-red-400" : "text-white"}>{stats.overdue}</strong> vencidas
        </button>
        <span className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
          🔴 <strong className="text-orange-400">{stats.urgent}</strong> urgentes
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs">
          👤 <strong className="text-amber-400">{stats.unassigned}</strong> sin asignar
        </span>
      </div>

      {/* Filters + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tarea o proyecto..."
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm placeholder:text-slate-500 w-48 sm:w-64"
          />
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as TaskPriority | "")}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
          >
            <option value="">Prioridad</option>
            <option value="Urgent">🔴 Urgente</option>
            <option value="High">🟠 Alta</option>
            <option value="Medium">🔵 Media</option>
            <option value="Low">⚪ Baja</option>
          </select>
          <select
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm"
          >
            <option value="">Asignado</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
          {activeFilters > 0 && (
            <button
              onClick={() => { setSearch(""); setFilterPriority(""); setFilterAssignee(""); setFilterOverdue(false); }}
              className="px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 transition"
            >
              ✕ Limpiar ({activeFilters})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Group by - only in grouped view */}
          {viewMode === "grouped" && (
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as GroupBy)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
            >
              <option value="project">Por proyecto</option>
              <option value="priority">Por prioridad</option>
              <option value="assignee">Por asignado</option>
            </select>
          )}
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs transition ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
            >
              ☰ Lista
            </button>
            <button
              onClick={() => setViewMode("grouped")}
              className={`px-3 py-1.5 text-xs transition ${viewMode === "grouped" ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
            >
              ▦ Agrupado
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 skeleton rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-slate-400 text-sm">No hay tareas que coincidan con los filtros</p>
        </div>
      ) : viewMode === "list" ? (
        /* ── List View ── */
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Tarea</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Proyecto</th>
                <th className="text-left px-4 py-3">Prioridad</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Asignado</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Vence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-slate-700/20 hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[280px]">{t.title}</p>
                    {t.columnName && (
                      <span className="text-[10px] text-slate-500">{t.columnName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                    <span className="truncate block max-w-[180px]">{t.projectName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${PRIORITY_CONFIG[t.priority]?.color ?? "text-slate-400"}`}>
                      {PRIORITY_CONFIG[t.priority]?.label ?? t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {t.assigneeName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400 shrink-0">
                          {t.assigneeName.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-300">{t.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {t.dueDate ? (
                      <span className={`text-xs ${isOverdue(t) ? "text-red-400 font-medium" : "text-slate-400"}`}>
                        {isOverdue(t) && "⚠ "}
                        {new Date(t.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Grouped View ── */
        <div className="space-y-4">
          {grouped.map(([key, group]) => (
            <div key={key} className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{group.label}</h4>
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {group.tasks.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-700/20">
                {group.tasks.map(t => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-800/40 transition">
                    {/* Priority dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${t.priority === "Urgent" ? "bg-red-500" : t.priority === "High" ? "bg-orange-500" : t.priority === "Medium" ? "bg-sky-500" : "bg-slate-500"}`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {groupBy !== "project" && (
                          <span className="text-[10px] text-slate-500">{t.projectName}</span>
                        )}
                        {groupBy !== "assignee" && t.assigneeName && (
                          <span className="text-[10px] text-slate-500">👤 {t.assigneeName}</span>
                        )}
                        {groupBy !== "priority" && (
                          <span className={`text-[10px] ${PRIORITY_CONFIG[t.priority]?.color ?? ""}`}>
                            {PRIORITY_CONFIG[t.priority]?.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {t.dueDate && (
                      <span className={`text-[10px] shrink-0 ${isOverdue(t) ? "text-red-400 font-medium" : "text-slate-500"}`}>
                        {isOverdue(t) && "⚠ "}
                        {new Date(t.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result count */}
      {!loading && filtered.length > 0 && (
        <p className="text-[10px] text-slate-600 text-right">
          Mostrando {filtered.length} de {tasks.length} tareas
        </p>
      )}
    </div>
  );
};

export default TasksPage;
