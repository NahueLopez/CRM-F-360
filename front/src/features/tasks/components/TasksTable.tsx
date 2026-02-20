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
  const getProjectName = (projectId: number) =>
    projects.find((p) => p.id === projectId)?.name ?? "—";

  const getUserName = (userId?: number) =>
    userId ? users.find((u) => u.id === userId)?.fullName ?? "—" : "—";

  const getPriorityLabel = (priority: Task["priority"]) => {
    switch (priority) {
      case "Low": return "Baja";
      case "Medium": return "Media";
      case "High": return "Alta";
      case "Urgent": return "Urgente";
      default: return priority;
    }
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <table className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm">
      <thead>
        <tr className="bg-slate-800 text-left">
          <th className="p-3">Tarea</th>
          <th className="p-3">Proyecto</th>
          <th className="p-3">Asignado a</th>
          <th className="p-3">Prioridad</th>
          <th className="p-3">Vencimiento</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id} className="border-b border-slate-800">
            <td className="p-3">{t.title}</td>
            <td className="p-3">{getProjectName(t.projectId)}</td>
            <td className="p-3">{getUserName(t.assigneeId)}</td>
            <td className="p-3">{getPriorityLabel(t.priority)}</td>
            <td className="p-3">{formatDate(t.dueDate)}</td>
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
              colSpan={6}
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
