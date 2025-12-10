import React, { useEffect, useState } from "react";
import type { PersonaEmpresa } from "../../types/personaEmpresa";
import type { Company } from "../../types/company";

interface PersonaEmpresaFormProps {
  initial: Partial<PersonaEmpresa>;
  empresa?: Company | null;       // empresa actual (para mostrar nombre)
  onSubmit: (data: Partial<PersonaEmpresa>) => void | Promise<void>;
  onCancel: () => void;
}

const PersonaEmpresaForm: React.FC<PersonaEmpresaFormProps> = ({
  initial,
  empresa,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState<Partial<PersonaEmpresa>>({
    nombreCompleto: "",
    rolEnEmpresa: "",
    email: "",
    telefono: "",
    principal: false,
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

    if (!form.nombreCompleto || form.nombreCompleto.trim() === "") {
      alert("El nombre completo es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        nombreCompleto: form.nombreCompleto,
        rolEnEmpresa: form.rolEnEmpresa,
        email: form.email,
        telefono: form.telefono,
        principal: form.principal ?? false,
        activa: form.activa ?? true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      {empresa && (
        <div className="text-xs text-slate-400 mb-2">
          Empresa:{" "}
          <span className="font-semibold text-slate-200">
            {empresa.razonSocial ?? empresa.nombreFantasia ?? `ID ${empresa.id}`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Nombre completo *
          </label>
          <input
            name="nombreCompleto"
            value={form.nombreCompleto ?? ""}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-slate-400">
            Rol en la empresa
          </label>
          <input
            name="rolEnEmpresa"
            value={form.rolEnEmpresa ?? ""}
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
            id="principal"
            type="checkbox"
            name="principal"
            checked={form.principal ?? false}
            onChange={handleCheckbox}
            className="rounded border-slate-600"
          />
          <label htmlFor="principal" className="text-xs text-slate-300">
            Persona principal
          </label>
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
            Contacto activo
          </label>
        </div>
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

export default PersonaEmpresaForm;
