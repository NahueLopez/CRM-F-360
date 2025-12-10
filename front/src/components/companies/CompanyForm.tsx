// src/components/companies/CompanyForm.tsx
import React, { useEffect, useState } from "react";
import type { Company } from "../../types/company";

interface CompanyFormProps {
  initial: Partial<Company>;
  onSubmit: (data: Partial<Company>) => void | Promise<void>;
  onCancel: () => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  initial,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<Partial<Company>>({
    razonSocial: "",
    nombreFantasia: "",
    cuit: "",
    email: "",
    telefono: "",
    direccion: "",
    activa: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm((prev) => ({
        ...prev,
        ...initial,
      }));
    }
  }, [initial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.razonSocial || !form.cuit) {
      alert("Razón social y CUIT son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        razonSocial: form.razonSocial,
        nombreFantasia: form.nombreFantasia,
        cuit: form.cuit,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        activa: form.activa ?? true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs mb-1 text-slate-400">Razón social *</label>
          <input
            name="razonSocial"
            value={form.razonSocial ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-400">Nombre de fantasía</label>
          <input
            name="nombreFantasia"
            value={form.nombreFantasia ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-400">CUIT *</label>
          <input
            name="cuit"
            value={form.cuit ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-400">Email</label>
          <input
            type="email"
            name="email"
            value={form.email ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-400">Teléfono</label>
          <input
            name="telefono"
            value={form.telefono ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 mt-5">
          <input
            id="activa"
            type="checkbox"
            name="activa"
            checked={form.activa ?? true}
            onChange={handleCheckbox}
            className="rounded border-slate-600"
          />
          <label htmlFor="activa" className="text-xs text-slate-300">
            Empresa activa
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs mb-1 text-slate-400">Dirección</label>
        <textarea
          name="direccion"
          value={form.direccion ?? ""}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
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

export default CompanyForm;
