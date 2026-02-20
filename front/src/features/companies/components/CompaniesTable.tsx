import React from "react";
import type { Company } from "../types";

interface Props {
  data: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: number) => void;
  onRowClick?: (company: Company) => void;
}

const CompaniesTable: React.FC<Props> = ({ data, onEdit, onDelete, onRowClick }) => {
  if (data.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-800/50">
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nombre</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">CUIT</th>
            <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((c) => (
            <tr
              key={c.id}
              onClick={() => onRowClick?.(c)}
              className={`group transition-colors ${onRowClick ? "cursor-pointer hover:bg-slate-800/60" : ""}`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-200">{c.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-400 tabular-nums">{c.cuit || "—"}</td>
              <td className="px-4 py-3 text-slate-400">{c.email || "—"}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
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

export default CompaniesTable;
