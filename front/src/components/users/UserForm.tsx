import React, { useEffect, useState } from "react";
import type { User } from "../../types/user";

interface UserFormData {
  fullName: string;
  email: string;
  phone: string;
  active: boolean;
  password?: string;
}

interface Props {
  initial?: Partial<User>;
  isEditing?: boolean;
  onSubmit: (values: Partial<UserFormData>) => void;
  onCancel?: () => void;
}

const UserForm: React.FC<Props> = ({ initial, isEditing, onSubmit, onCancel }) => {
  const [form, setForm] = useState<UserFormData>({
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    if (!form.fullName || form.fullName.trim() === "") {
      alert("El nombre es obligatorio");
      return;
    }
    if (!form.email || form.email.trim() === "") {
      alert("El email es obligatorio");
      return;
    }
    if (!isEditing && (!form.password || form.password.trim() === "")) {
      alert("La contraseña es obligatoria");
      return;
    }

    const payload: Partial<UserFormData> = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone || undefined,
      active: form.active,
    };

    if (form.password && form.password.trim() !== "") {
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  return (
    <div className="space-y-3">
      <input
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        placeholder="Nombre completo"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500"
      />

      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500"
      />

      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Teléfono (opcional)"
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500"
      />

      {!isEditing && (
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Contraseña"
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500"
        />
      )}

      <label className="inline-flex items-center gap-2 text-sm text-slate-300">
        <input
          name="active"
          type="checkbox"
          checked={form.active}
          onChange={handleChange}
          className="rounded border-slate-600 bg-slate-800"
        />
        Activo
      </label>

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:bg-slate-800 transition"
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

export default UserForm;
