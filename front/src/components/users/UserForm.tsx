import React, { useEffect, useState } from "react";
import { User } from "../../types/user";

type CreatePayload = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

type UpdatePayload = {
  fullName: string;
  email: string;
  phone?: string;
  active: boolean;
};

type FormSubmit = (values: CreatePayload | UpdatePayload) => void | Promise<void>;

interface Props {
  initial?: Partial<User>;
  onSubmit: FormSubmit;
  onCancel?: () => void;
}

const UserForm: React.FC<Props> = ({ initial, onSubmit, onCancel }) => {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    active: boolean;
    password: string;
  }>({
    fullName: initial?.fullName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    active: initial?.active ?? true,
    password: "",
  });

  useEffect(() => {
    setForm({
      fullName: initial?.fullName ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      active: initial?.active ?? true,
      password: "",
    });
  }, [initial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.fullName.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    if (!form.email.trim()) {
      alert("El email es obligatorio");
      return;
    }

    if (!isEdit) {
      if (!form.password.trim()) {
        alert("La contraseña es obligatoria");
        return;
      }

      const payload: CreatePayload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      };
      onSubmit(payload);
    } else {
      const payload: UpdatePayload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        active: form.active,
      };
      onSubmit(payload);
    }
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Nombre completo *
          </label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Email *
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Teléfono
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>

        {isEdit && (
          <div className="flex items-center gap-2 mt-6">
            <input
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={handleChange}
              className="rounded border-slate-600 bg-slate-800"
            />
            <span className="text-xs text-slate-300">Usuario activo</span>
          </div>
        )}
      </div>

      {!isEdit && (
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Contraseña inicial *
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700"
          />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-600 text-xs"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-indigo-600 text-xs font-medium"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default UserForm;
