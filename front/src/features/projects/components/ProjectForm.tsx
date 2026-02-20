import React, { useEffect, useState } from "react";
import type { Project, ProjectStatus } from "../types";
import type { Company } from "../../companies/types";
import type { User } from "../../users/types";

interface Props {
  initial?: Partial<Project>;
  companies: Company[];
  users: User[];
  onSubmit: (values: Partial<Project>, memberIds?: number[]) => void;
  onCancel?: () => void;
}

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "Planned", label: "Planeado" },
  { value: "InProgress", label: "En curso" },
  { value: "Paused", label: "Pausado" },
  { value: "Done", label: "Finalizado" },
];

const ProjectForm: React.FC<Props> = ({
  initial,
  companies,
  users,
  onSubmit,
  onCancel,
}) => {
  const isEditing = !!(initial?.id);

  const [form, setForm] = useState<Partial<Project>>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    companyId: initial?.companyId ?? (companies[0]?.id ?? undefined),
    status: initial?.status ?? "Planned",
    estimatedHours: initial?.estimatedHours ?? undefined,
    startDate: initial?.startDate ?? undefined,
    endDateEstimated: initial?.endDateEstimated ?? undefined,
  });

  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  useEffect(() => {
    setForm({
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      companyId: initial?.companyId ?? (companies[0]?.id ?? undefined),
      status: initial?.status ?? "Planned",
      estimatedHours: initial?.estimatedHours ?? undefined,
      startDate: initial?.startDate ?? undefined,
      endDateEstimated: initial?.endDateEstimated ?? undefined,
    });
    setSelectedMembers([]);
  }, [initial, companies]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "estimatedHours") {
      setForm({ ...form, [name]: value === "" ? undefined : Number(value) });
      return;
    }

    if (name === "companyId") {
      setForm({ ...form, [name]: Number(value) });
      return;
    }

    if (name === "startDate" || name === "endDateEstimated") {
      setForm({ ...form, [name]: value || undefined });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    if (!form.name || form.name.trim() === "") {
      alert("El nombre del proyecto es obligatorio");
      return;
    }
    if (!form.companyId) {
      alert("Tenés que seleccionar una empresa");
      return;
    }
    onSubmit(form, isEditing ? undefined : selectedMembers);
  };

  return (
    <div className="space-y-3">
      {/* Empresa */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Empresa</label>
        <select
          name="companyId"
          value={form.companyId ?? ""}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
        >
          <option value="">Seleccionar empresa</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Nombre del proyecto
        </label>
        <input
          name="name"
          value={form.name ?? ""}
          onChange={handleChange}
          placeholder="Nombre del proyecto"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
        />
      </div>

      {/* Estado + Horas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Estado</label>
          <select
            name="status"
            value={form.status ?? "Planned"}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Horas estimadas
          </label>
          <input
            name="estimatedHours"
            type="number"
            step="0.5"
            min="0"
            value={form.estimatedHours ?? ""}
            onChange={handleChange}
            placeholder="Opcional"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Fecha inicio
          </label>
          <input
            name="startDate"
            type="date"
            value={form.startDate?.slice(0, 10) ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Fecha fin estimada
          </label>
          <input
            name="endDateEstimated"
            type="date"
            value={form.endDateEstimated?.slice(0, 10) ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Descripción
        </label>
        <textarea
          name="description"
          value={form.description ?? ""}
          onChange={handleChange}
          placeholder="Descripción del proyecto"
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 resize-none"
        />
      </div>

      {/* Members (only on create) */}
      {!isEditing && users.length > 0 && (
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            Asignar miembros al proyecto
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-800/50 border border-slate-700">
            {users.map((u) => (
              <label
                key={u.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition text-sm
                  ${selectedMembers.includes(u.id)
                    ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300"
                    : "bg-slate-800 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  className="accent-indigo-500"
                />
                <div>
                  <span className="block text-xs font-medium">{u.fullName}</span>
                  <span className="block text-[10px] text-slate-500">{u.email}</span>
                </div>
              </label>
            ))}
          </div>
          {selectedMembers.length > 0 && (
            <p className="text-[10px] text-indigo-400 mt-1">
              {selectedMembers.length} miembro{selectedMembers.length > 1 ? "s" : ""} seleccionado{selectedMembers.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-600 text-sm"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white transition"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default ProjectForm;
