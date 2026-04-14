import React, { useEffect, useState } from "react";
import type { Company } from "../types";
import type { User } from "../../users/types";
import { userService } from "../../users/userService";
import { companySchema, validateForm } from "../../../shared/schemas/formSchemas";
import { useIsLight } from "../../../shared/hooks/useIsLight";

const STATUS_OPTIONS = [
  { value: "", label: "Sin estado" },
  { value: "Contacto", label: "📞 Contacto" },
  { value: "Interesado", label: "💡 Interesado" },
  { value: "Cierre", label: "🤝 Cierre" },
  { value: "Implementación", label: "🚀 Implementación" },
  { value: "Fidelización", label: "⭐ Fidelización" },
  { value: "Perdido", label: "❌ Perdido" },
];

interface Props {
  initial?: Partial<Company>;
  onSubmit: (values: Partial<Company>) => void;
  onCancel?: () => void;
  onError?: (msg: string) => void;
}

const CompanyForm: React.FC<Props> = ({ initial, onSubmit, onCancel, onError }) => {
  const isLight = useIsLight();

  const [form, setForm] = useState<Partial<Company>>({
    name: initial?.name ?? "",
    cuit: initial?.cuit ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    industry: initial?.industry ?? "",
    website: initial?.website ?? "",
    notes: initial?.notes ?? "",
    clientName: initial?.clientName ?? "",
    commercialAgent: initial?.commercialAgent ?? "",
    status: initial?.status ?? "",
    socialMedia: initial?.socialMedia ?? "",
    followUp: initial?.followUp ?? "",
    location: initial?.location ?? "",
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    userService.getAll().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    setForm({
      name: initial?.name ?? "",
      cuit: initial?.cuit ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      industry: initial?.industry ?? "",
      website: initial?.website ?? "",
      notes: initial?.notes ?? "",
      clientName: initial?.clientName ?? "",
      commercialAgent: initial?.commercialAgent ?? "",
      status: initial?.status ?? "",
      socialMedia: initial?.socialMedia ?? "",
      followUp: initial?.followUp ?? "",
      location: initial?.location ?? "",
    });
  }, [initial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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

  // Theme classes
  const inputCls = isLight
    ? "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400"
    : "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500/50";
  const labelCls = isLight ? "text-slate-600" : "text-slate-400";
  const sectionBorder = isLight ? "border-slate-200" : "border-slate-700/30";

  return (
    <div className="space-y-5">
      {/* ── Datos principales ── */}
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${labelCls}`}>
          📋 Datos principales
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Empresa *
            </label>
            <input
              name="name"
              value={form.name ?? ""}
              onChange={handleChange}
              placeholder="Nombre de la empresa"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Cliente / Contacto
            </label>
            <input
              name="clientName"
              value={form.clientName ?? ""}
              onChange={handleChange}
              placeholder="Nombre del contacto"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Comercial asignado
            </label>
            <select
              name="commercialAgent"
              value={form.commercialAgent ?? ""}
              onChange={handleChange}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            >
              <option value="">— Sin asignar —</option>
              {users.filter(u => u.active).map((u) => (
                <option key={u.id} value={u.fullName}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Estado
            </label>
            <select
              name="status"
              value={form.status ?? ""}
              onChange={handleChange}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              CUIT / Identificación
            </label>
            <input
              name="cuit"
              value={form.cuit ?? ""}
              onChange={handleChange}
              placeholder="XX-XXXXXXXX-X"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Rubro / Industria
            </label>
            <input
              name="industry"
              value={form.industry ?? ""}
              onChange={handleChange}
              placeholder="Ej: Tecnología, Comercio..."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
        </div>
      </div>

      {/* ── Contacto ── */}
      <div className={`border-t pt-4 ${sectionBorder}`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${labelCls}`}>
          📞 Contacto
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Email
            </label>
            <input
              name="email"
              value={form.email ?? ""}
              onChange={handleChange}
              placeholder="email@empresa.com"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Teléfono
            </label>
            <input
              name="phone"
              value={form.phone ?? ""}
              onChange={handleChange}
              placeholder="+54 9 11 XXXX-XXXX"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Sitio web
            </label>
            <input
              name="website"
              value={form.website ?? ""}
              onChange={handleChange}
              placeholder="https://www.empresa.com"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Redes sociales
            </label>
            <input
              name="socialMedia"
              value={form.socialMedia ?? ""}
              onChange={handleChange}
              placeholder="Instagram, LinkedIn, etc."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
          <div className="col-span-2">
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              📍 Ubicación
            </label>
            <input
              name="location"
              value={form.location ?? ""}
              onChange={handleChange}
              placeholder="Ciudad, Provincia, País"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${inputCls}`}
            />
          </div>
        </div>
      </div>

      {/* ── Seguimiento ── */}
      <div className={`border-t pt-4 ${sectionBorder}`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${labelCls}`}>
          📝 Seguimiento
        </p>
        <div className="space-y-3">
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Seguimiento
            </label>
            <textarea
              name="followUp"
              value={form.followUp ?? ""}
              onChange={handleChange}
              rows={2}
              placeholder="Próximos pasos, recordatorios..."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${inputCls}`}
            />
          </div>
          <div>
            <label className={`text-[11px] font-medium mb-1 block ${labelCls}`}>
              Notas generales
            </label>
            <textarea
              name="notes"
              value={form.notes ?? ""}
              onChange={handleChange}
              rows={2}
              placeholder="Observaciones, referencias..."
              className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${inputCls}`}
            />
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-0.5">
          {errors.map((e, i) => (
            <p key={i}>⚠️ {e}</p>
          ))}
        </div>
      )}

      <div className={`flex gap-2 justify-end pt-2 border-t ${sectionBorder}`}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              isLight
                ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                : "border-slate-600 text-slate-300 hover:bg-slate-800"
            }`}
          >
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.97]"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default CompanyForm;
