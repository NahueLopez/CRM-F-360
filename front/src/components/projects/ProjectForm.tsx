import React, { useEffect, useState } from "react";
import type { Project, ProjectStatus } from "../../types/project";
import type { Company } from "../../types/company";

interface Props {
  initial: Partial<Project>;
  companies: Company[];
  onSubmit: (values: Partial<Project>) => void | Promise<void>;
  onCancel: () => void;
}

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 1, label: "Planeado" },
  { value: 2, label: "En curso" },
  { value: 3, label: "Pausado" },
  { value: 4, label: "Finalizado" },
];

const ProjectForm: React.FC<Props> = ({
  initial,
  companies,
  onSubmit,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Partial<Project>>({
    empresaId: initial.empresaId ?? companies[0]?.id,
    nombre: initial.nombre ?? "",
    descripcion: initial.descripcion ?? "",
    fechaInicio: initial.fechaInicio ?? new Date().toISOString(),
    fechaFin: initial.fechaFin ?? null,
    estado: initial.estado ?? 1,
    horasEstimadasMensuales: initial.horasEstimadasMensuales ?? undefined,
    horasEstimadasTotales: initial.horasEstimadasTotales ?? undefined,
  });

  useEffect(() => {
    setForm({
      empresaId: initial.empresaId ?? companies[0]?.id,
      nombre: initial.nombre ?? "",
      descripcion: initial.descripcion ?? "",
      fechaInicio: initial.fechaInicio ?? new Date().toISOString(),
      fechaFin: initial.fechaFin ?? null,
      estado: initial.estado ?? 1,
      horasEstimadasMensuales: initial.horasEstimadasMensuales ?? undefined,
      horasEstimadasTotales: initial.horasEstimadasTotales ?? undefined,
    });
  }, [initial, companies]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "empresaId" || name === "estado") {
      setForm((prev) => ({ ...prev, [name]: value === "" ? undefined : Number(value) }));
      return;
    }

    if (name === "horasEstimadasMensuales" || name === "horasEstimadasTotales") {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
      return;
    }

    // fechas: guardamos ISO, pero el input usa yyyy-MM-dd
    if (name === "fechaInicio" || name === "fechaFin") {
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

    if (!form.nombre || !form.nombre.trim()) {
      alert("El nombre del proyecto es obligatorio.");
      return;
    }
    if (!form.empresaId) {
      alert("Tenés que seleccionar una empresa.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  const fechaInicioValue =
    form.fechaInicio ? form.fechaInicio.substring(0, 10) : "";
  const fechaFinValue = form.fechaFin ? form.fechaFin.substring(0, 10) : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Empresa */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Empresa *
          </label>
          <select
            name="empresaId"
            value={form.empresaId ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          >
            <option value="">Seleccionar empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razonSocial}
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

        {/* Fechas */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Fecha inicio
          </label>
          <input
            type="date"
            name="fechaInicio"
            value={fechaInicioValue}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Fecha fin (opcional)
          </label>
          <input
            type="date"
            name="fechaFin"
            value={fechaFinValue}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>

        {/* Horas estimadas */}
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Horas estimadas mensuales
          </label>
          <input
            type="number"
            step="0.01"
            name="horasEstimadasMensuales"
            value={form.horasEstimadasMensuales ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Horas estimadas totales
          </label>
          <input
            type="number"
            step="0.01"
            name="horasEstimadasTotales"
            value={form.horasEstimadasTotales ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>
      </div>

      {/* Nombre y descripción */}
      <div>
        <label className="block text-xs mb-1 text-slate-400">
          Nombre del proyecto *
        </label>
        <input
          name="nombre"
          value={form.nombre ?? ""}
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

export default ProjectForm;
