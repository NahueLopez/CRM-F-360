import React from "react";
import type { User } from "../types";

interface Props {
  data: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

const UsersTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  if (data.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/50">
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Teléfono</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((u) => (
            <tr key={u.id} className="group transition-colors hover:bg-slate-800/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                    {u.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-200">{u.fullName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400">{u.email}</td>
              <td className="px-4 py-3 text-slate-400">{u.phone ?? "—"}</td>
              <td className="px-4 py-3">
                {u.active ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    Inactivo
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(u)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => onDelete(u.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
