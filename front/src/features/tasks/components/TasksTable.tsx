import React from "react";
import type { Task } from "../types";
import type { Project } from "../../projects/types";
import type { User } from "../../users/types";

interface Props {
  data: Task[];
  projects: Project[];
  users: User[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  Urgent: { label: "Urgente", color: "text-red-400", bg: "bg-red-500/10" },
  High: { label: "Alta", color: "text-orange-400", bg: "bg-orange-500/10" },
  Medium: { label: "Media", color: "text-sky-400", bg: "bg-sky-500/10" },
  Low: { label: "Baja", color: "text-slate-400", bg: "bg-slate-500/10" },
};

const TasksTable: React.FC<Props> = ({ data, projects, users, onEdit, onDelete }) => {
  const getProjectName = (projectId: number) =>
    projects.find((p) => p.id === projectId)?.name ?? "—";

  const getUserName = (userId?: number) =>
    userId ? users.find((u) => u.id === userId)?.fullName ?? "—" : "—";

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const isOverdue = d < now;
    const formatted = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    return { formatted, isOverdue };
  };

  if (data.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/50">
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tarea</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Proyecto</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Asignado</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prioridad</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Vence</th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((t) => {
            const pri = priorityConfig[t.priority] ?? priorityConfig.Medium;
            const date = formatDate(t.dueDate);
            const dateInfo = typeof date === "string" ? { formatted: date, isOverdue: false } : date;
            return (
              <tr key={t.id} className="group transition-colors hover:bg-slate-800/60">
                <td className="px-4 py-3 font-medium text-slate-200 max-w-[200px] truncate">{t.title}</td>
                <td className="px-4 py-3 text-slate-400">{getProjectName(t.projectId)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0">
                      {getUserName(t.assigneeId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-300 text-xs">{getUserName(t.assigneeId).split(" ")[0]}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${pri.color} ${pri.bg}`}>
                    {pri.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs tabular-nums ${dateInfo.isOverdue ? "text-red-400 font-medium" : "text-slate-400"}`}>
                    {dateInfo.isOverdue && "⚠ "}{dateInfo.formatted}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(t)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TasksTable;
