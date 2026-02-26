import React, { useEffect, useState } from "react";
import type { Company } from "../types";
import { companySchema, validateForm } from "../../../shared/schemas/formSchemas";

interface Props {
  initial?: Partial<Company>;
  onSubmit: (values: Partial<Company>) => void;
  onCancel?: () => void;
  onError?: (msg: string) => void;
}

const CompanyForm: React.FC<Props> = ({ initial, onSubmit, onCancel, onError }) => {
  const [form, setForm] = useState<Partial<Company>>({
    name: initial?.name ?? "",
    cuit: initial?.cuit ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    notes: initial?.notes ?? "",
  });

  const [errors, setErrors] = useState<string[]>([]);

  // 🔁 Cuando cambie "initial" (por ejemplo al editar otra empresa), se actualiza el form
  useEffect(() => {
    setForm({
      name: initial?.name ?? "",
      cuit: initial?.cuit ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      notes: initial?.notes ?? "",
    });
  }, [initial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors([]);
  };

  const handleSubmit = () => {
    const errs: string[] = [];
    const parsed = validateForm(companySchema, form, (msg) => errs.push(msg));
    if (!parsed) {
      setErrors(errs);
      if (onError) errs.forEach(onError);
      return;
    }
    onSubmit(parsed);
  };

  return (
    <div className="space-y-3">
      <input
        name="name"
        value={form.name ?? ""}
        onChange={handleChange}
        placeholder="Nombre de empresa"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
      />

      <input
        name="cuit"
        value={form.cuit ?? ""}
        onChange={handleChange}
        placeholder="CUIT"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
      />

      <input
        name="email"
        value={form.email ?? ""}
        onChange={handleChange}
        placeholder="Email"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
      />

      <input
        name="phone"
        value={form.phone ?? ""}
        onChange={handleChange}
        placeholder="Teléfono"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
      />

      <textarea
        name="notes"
        value={form.notes ?? ""}
        onChange={handleChange}
        placeholder="Notas"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
      />
      {errors.length > 0 && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 space-y-0.5">
          {errors.map((e, i) => <p key={i}>⚠️ {e}</p>)}
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

export default CompanyForm;
