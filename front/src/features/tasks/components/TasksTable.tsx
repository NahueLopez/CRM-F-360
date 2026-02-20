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

const TasksTable: React.FC<Props> = ({
  data,
  projects,
  users,
  onEdit,
  onDelete,
}) => {
  const getProjectName = (proyectoId: number) =>
    projects.find((p) => p.id === proyectoId)?.nombre ?? "—";

  const getUserName = (userId?: number | null) =>
    userId ? users.find((u) => u.id === userId)?.fullName ?? "—" : "—";

  const getStatusLabel = (estado: Task["estado"]) => {
    switch (estado) {
      case 1: return "Pendiente";
      case 2: return "En progreso";
      case 3: return "Bloqueada";
      case 4: return "Finalizada";
      default: return estado;
    }
  };

  const getPriorityLabel = (prioridad: Task["prioridad"]) => {
    switch (prioridad) {
      case 1: return "Baja";
      case 2: return "Media";
      case 3: return "Alta";
      default: return prioridad;
    }
  };

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <table className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm">
      <thead>
        <tr className="bg-slate-800 text-left">
          <th className="p-3">Tarea</th>
          <th className="p-3">Proyecto</th>
          <th className="p-3">Asignado a</th>
          <th className="p-3">Estado</th>
          <th className="p-3">Prioridad</th>
          <th className="p-3">Vencimiento</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id} className="border-b border-slate-800">
            <td className="p-3">{t.titulo}</td>
            <td className="p-3">{getProjectName(t.proyectoId)}</td>
            <td className="p-3">{getUserName(t.asignadoAId)}</td>
            <td className="p-3">{getStatusLabel(t.estado)}</td>
            <td className="p-3">{getPriorityLabel(t.prioridad)}</td>
            <td className="p-3">{formatDate(t.fechaVencimiento)}</td>
            <td className="p-3 space-x-2">
              <button
                onClick={() => onEdit(t)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(t.id)}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs"
              >
                Borrar
              </button>
            </td>
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="p-3 text-center text-slate-500 italic"
            >
              Todavía no hay tareas.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default TasksTable;
