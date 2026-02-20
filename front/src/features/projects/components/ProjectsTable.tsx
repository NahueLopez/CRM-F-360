import React from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "../types";
import type { Company } from "../../companies/types";

interface Props {
  data: Project[];
  companies: Company[];
  onEdit?: (project: Project) => void;
  onDelete?: (id: number) => void;
  onTeam?: (projectId: number) => void;
}

const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
  Planned: { text: "Planeado", color: "text-slate-400", bg: "bg-slate-400/10" },
  InProgress: { text: "En curso", color: "text-sky-400", bg: "bg-sky-400/10" },
  Paused: { text: "Pausado", color: "text-amber-400", bg: "bg-amber-400/10" },
  Done: { text: "Finalizado", color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

const ProjectsTable: React.FC<Props> = ({ data, companies, onEdit, onDelete, onTeam }) => {
  const navigate = useNavigate();

  const getCompanyName = (companyId: number) =>
    companies.find((c) => c.id === companyId)?.name ?? "—";

  if (data.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/50">
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Proyecto</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Empresa</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tareas</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Horas est.</th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((p) => {
            const st = statusLabel[p.status] ?? statusLabel.Planned;
            return (
              <tr key={p.id} className="group transition-colors hover:bg-slate-800/60">
                <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                <td className="px-4 py-3 text-slate-400">
                  {p.companyName ?? getCompanyName(p.companyId)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${st.color} ${st.bg}`}>
                    {st.text}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 tabular-nums">{p.taskCount ?? 0}</td>
                <td className="px-4 py-3 text-slate-400 tabular-nums">
                  {p.estimatedHours != null ? `${p.estimatedHours} hs` : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/projects/${p.id}/board`)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:text-white hover:bg-indigo-600/20 transition-all"
                    >
                      📋 Tablero
                    </button>
                    {onTeam && (
                      <button
                        onClick={() => onTeam(p.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-violet-400/70 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                      >
                        👥
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(p)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                      >
                        ✏️
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(p.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        🗑️
                      </button>
                    )}
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

export default ProjectsTable;
