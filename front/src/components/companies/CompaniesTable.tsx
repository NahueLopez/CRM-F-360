import React from "react";
import type { Company } from "../../types/company";

interface Props {
  data: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: number) => void;
}

const CompaniesTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  return (
    <table className="w-full bg-slate-900 border border-slate-800 rounded-lg">
      <thead>
        <tr className="bg-slate-800 text-left">
          <th className="p-3">Nombre</th>
          <th className="p-3">CUIT</th>
          <th className="p-3">Email</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {data.map((c) => (
          <tr key={c.id} className="border-b border-slate-800">
            <td className="p-3">{c.name}</td>
            <td className="p-3">{c.cuit}</td>
            <td className="p-3">{c.email}</td>

            <td className="p-3 space-x-2">
              <button
                onClick={() => onEdit(c)}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm"
              >
                Editar
              </button>

              <button
                onClick={() => onDelete(c.id)}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-sm"
              >
                Borrar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CompaniesTable;
