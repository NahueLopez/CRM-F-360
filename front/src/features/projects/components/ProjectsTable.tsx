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

const statusLabel: Record<string, { text: string; color: string }> = {
  Planned: { text: "Planeado", color: "text-slate-400" },
  InProgress: { text: "En curso", color: "text-sky-400" },
  Paused: { text: "Pausado", color: "text-amber-400" },
  Done: { text: "Finalizado", color: "text-emerald-400" },
};

const ProjectsTable: React.FC<Props> = ({ data, companies, onEdit, onDelete, onTeam }) => {
  const navigate = useNavigate();

  const getCompanyName = (companyId: number) =>
    companies.find((c) => c.id === companyId)?.name ?? "—";

  return (
    <table className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm">
      <thead>
        <tr className="bg-slate-800 text-left">
          <th className="p-3">Proyecto</th>
          <th className="p-3">Empresa</th>
          <th className="p-3">Estado</th>
          <th className="p-3">Tareas</th>
          <th className="p-3">Horas estimadas</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p) => {
          const st = statusLabel[p.status] ?? statusLabel.Planned;
          return (
            <tr key={p.id} className="border-b border-slate-800">
              <td className="p-3 font-medium">{p.name}</td>
              <td className="p-3 text-slate-400">
                {p.companyName ?? getCompanyName(p.companyId)}
              </td>
              <td className="p-3">
                <span className={st.color}>{st.text}</span>
              </td>
              <td className="p-3 text-slate-400">{p.taskCount ?? 0}</td>
              <td className="p-3 text-slate-400">
                {p.estimatedHours != null ? `${p.estimatedHours} hs` : "—"}
              </td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => navigate(`/projects/${p.id}/board`)}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs transition"
                >
                  Tablero
                </button>
                {onTeam && (
                  <button
                    onClick={() => onTeam(p.id)}
                    className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-500 text-xs transition"
                  >
                    Equipo
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(p)}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs transition"
                  >
                    Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(p.id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs transition"
                  >
                    Borrar
                  </button>
                )}
              </td>
            </tr>
          );
        })}
        {data.length === 0 && (
          <tr>
            <td colSpan={6} className="p-3 text-center text-slate-500 italic">
              Todavía no hay proyectos.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ProjectsTable;
