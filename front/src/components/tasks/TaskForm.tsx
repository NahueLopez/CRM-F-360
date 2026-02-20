import React, { useEffect, useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "../../types/task";
import type { Project } from "../../types/project";
import type { User } from "../../types/user";

interface Props {
  initial: Partial<Task>;
  projects: Project[];
  users: User[];
  onSubmit: (values: Partial<Task>) => void | Promise<void>;
  onCancel: () => void;
}

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 1, label: "Pendiente" },
  { value: 2, label: "En progreso" },
  { value: 3, label: "Bloqueada" },
  { value: 4, label: "Finalizada" },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 1, label: "Baja" },
  { value: 2, label: "Media" },
  { value: 3, label: "Alta" },
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
    proyectoId: initial.proyectoId ?? projects[0]?.id,
    titulo: initial.titulo ?? "",
    descripcion: initial.descripcion ?? "",
    asignadoAId: initial.asignadoAId ?? undefined,
    fechaVencimiento: initial.fechaVencimiento ?? null,
    estado: initial.estado ?? 1,
    prioridad: initial.prioridad ?? 2,
  });

  useEffect(() => {
    setForm({
      proyectoId: initial.proyectoId ?? projects[0]?.id,
      titulo: initial.titulo ?? "",
      descripcion: initial.descripcion ?? "",
      asignadoAId: initial.asignadoAId ?? undefined,
      fechaVencimiento: initial.fechaVencimiento ?? null,
      estado: initial.estado ?? 1,
      prioridad: initial.prioridad ?? 2,
    });
  }, [initial, projects]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (["proyectoId", "estado", "prioridad", "asignadoAId"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
      return;
    }

    if (name === "fechaVencimiento") {
      setForm((prev) => ({
        ...prev,
        [name]: value ? new Date(value).toISOString() : null,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo || !form.titulo.trim()) {
      alert("El título de la tarea es obligatorio.");
      return;
    }
    if (!form.proyectoId) {
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

  const fechaVencimientoValue = form.fechaVencimiento
    ? form.fechaVencimiento.substring(0, 10)
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
            name="proyectoId"
            value={form.proyectoId ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            <option value="">Seleccionar proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
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
            name="asignadoAId"
            value={form.asignadoAId ?? ""}
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

        {/* Estado */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Estado
          </label>
          <select
            name="estado"
            value={form.estado ?? 1}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
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
            name="prioridad"
            value={form.prioridad ?? 2}
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
            name="fechaVencimiento"
            value={fechaVencimientoValue}
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
          name="titulo"
          value={form.titulo ?? ""}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
        />
      </div>

      <div>
        <label className="block text-xs mb-1 text-slate-400">
          Descripción
        </label>
        <textarea
          name="descripcion"
          value={form.descripcion ?? ""}
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
