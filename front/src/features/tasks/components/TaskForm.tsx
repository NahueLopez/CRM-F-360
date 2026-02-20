import React, { useEffect, useState } from "react";
import type { Task, TaskPriority } from "../types";
import type { Project } from "../../projects/types";
import type { User } from "../../users/types";

interface Props {
  initial: Partial<Task>;
  projects: Project[];
  users: User[];
  onSubmit: (values: Partial<Task>) => void | Promise<void>;
  onCancel: () => void;
}


const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "Low", label: "Baja" },
  { value: "Medium", label: "Media" },
  { value: "High", label: "Alta" },
];

const TaskForm: React.FC<Props> = ({
  initial,
  projects,
  users,
  onSubmit,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<Task>>({
    projectId: initial.projectId ?? projects[0]?.id,
    title: initial.title ?? "",
    description: initial.description ?? "",
    assigneeId: initial.assigneeId ?? undefined,
    dueDate: initial.dueDate ?? undefined,
    priority: initial.priority ?? "Medium",
  });

  useEffect(() => {
    setForm({
      projectId: initial.projectId ?? projects[0]?.id,
      title: initial.title ?? "",
      description: initial.description ?? "",
      assigneeId: initial.assigneeId ?? undefined,
      dueDate: initial.dueDate ?? undefined,
      priority: initial.priority ?? "Medium",
    });
  }, [initial, projects]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (["projectId", "assigneeId"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
      return;
    }

    if (name === "dueDate") {
      setForm((prev) => ({
        ...prev,
        [name]: value ? new Date(value).toISOString() : undefined,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.title.trim()) {
      alert("El título de la tarea es obligatorio.");
      return;
    }
    if (!form.projectId) {
      alert("Tenés que seleccionar un proyecto.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  const dueDateValue = form.dueDate
    ? form.dueDate.substring(0, 10)
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Proyecto */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Proyecto *
          </label>
          <select
            name="projectId"
            value={form.projectId ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            <option value="">Seleccionar proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Asignado a */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Asignado a
          </label>
          <select
            name="assigneeId"
            value={form.assigneeId ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Prioridad
          </label>
          <select
            name="priority"
            value={form.priority ?? "Medium"}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha vencimiento */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Fecha de vencimiento
          </label>
          <input
            type="date"
            name="dueDate"
            value={dueDateValue}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>
      </div>

      {/* Título y descripción */}
      <div>
        <label className="block text-xs mb-1 text-slate-400">
          Título de la tarea *
        </label>
        <input
          name="title"
          value={form.title ?? ""}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
        />
      </div>

      <div>
        <label className="block text-xs mb-1 text-slate-400">
          Descripción
        </label>
        <textarea
          name="description"
          value={form.description ?? ""}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg border border-slate-600 text-xs"
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-primary hover:bg-indigo-600 text-xs font-medium"
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
