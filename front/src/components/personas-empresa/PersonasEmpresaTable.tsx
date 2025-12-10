import React from "react";
import type { PersonaEmpresa } from "../../types/personaEmpresa";

interface PersonasEmpresaTableProps {
  data: PersonaEmpresa[];
  onEdit: (persona: PersonaEmpresa) => void;
  onDelete: (id: number) => void;
}

const PersonasEmpresaTable: React.FC<PersonasEmpresaTableProps> = ({
  data,
  onEdit,
  onDelete,
}) => {
  return (
    <table className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm">
      <thead>
        <tr className="bg-slate-800 text-left">
          <th className="p-3">Nombre</th>
          <th className="p-3">Rol</th>
          <th className="p-3">Contacto</th>
          <th className="p-3">Principal</th>
          <th className="p-3">Estado</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr key={p.id} className="border-b border-slate-800">
            <td className="p-3">{p.nombreCompleto}</td>
            <td className="p-3">{p.rolEnEmpresa ?? "—"}</td>
            <td className="p-3">
              <div className="flex flex-col gap-0.5">
                {p.email && (
                  <span className="text-xs text-slate-300">{p.email}</span>
                )}
                {p.telefono && (
                  <span className="text-xs text-slate-400">{p.telefono}</span>
                )}
                {!p.email && !p.telefono && (
                  <span className="text-xs text-slate-500">Sin datos</span>
                )}
              </div>
            </td>
            <td className="p-3">
              {p.principal ? (
                <span className="text-emerald-400 text-xs font-medium">
                  Sí
                </span>
              ) : (
                <span className="text-slate-500 text-xs">No</span>
              )}
            </td>
            <td className="p-3">
              {p.activa ? (
                <span className="text-emerald-400 text-xs">Activa</span>
              ) : (
                <span className="text-slate-500 text-xs">Inactiva</span>
              )}
            </td>
            <td className="p-3 space-x-2">
              <button
                onClick={() => onEdit(p)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs"
              >
                Borrar
              </button>
            </td>
          </tr>
        ))}
        {data.length === 0 && (
          <tr>
            <td
              colSpan={6}
              className="p-3 text-center text-slate-500 italic"
            >
              Todavía no hay contactos cargados para esta empresa.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default PersonasEmpresaTable;
