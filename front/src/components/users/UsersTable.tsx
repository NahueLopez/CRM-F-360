import React from "react";
import type { User } from "../../types/user";

interface Props {
  data: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

const UsersTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <table className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm">
      <thead>
        <tr className="bg-slate-800 text-left">
          <th className="p-3">Nombre</th>
          <th className="p-3">Email</th>
          <th className="p-3">Teléfono</th>
          <th className="p-3">Estado</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((u) => (
          <tr key={u.id} className="border-b border-slate-800">
            <td className="p-3">{u.fullName}</td>
            <td className="p-3">{u.email}</td>
            <td className="p-3 text-slate-400">{u.phone ?? "—"}</td>
            <td className="p-3">
              {u.active ? (
                <span className="text-emerald-400">Activo</span>
              ) : (
                <span className="text-slate-500">Inactivo</span>
              )}
            </td>
            <td className="p-3 space-x-2">
              <button
                onClick={() => onEdit(u)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs transition"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(u.id)}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs transition"
              >
                Borrar
              </button>
            </td>
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td colSpan={5} className="p-3 text-center text-slate-500 italic">
              Todavía no hay usuarios.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default UsersTable;
