import React from "react";
import { Project } from "../../types/project";
import { Company } from "../../types/company";

interface Props {
  data: Project[];
  companies: Company[];
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
}

const ProjectsTable: React.FC<Props> = ({
  data,
  companies,
  onEdit,
  onDelete,
}) => {
  const getCompanyName = (empresaId: number) =>
    companies.find((c) => c.id === empresaId)?.razonSocial ?? "—";

  const getStatusLabel = (estado: Project["estado"]) => {
    switch (estado) {
      case 1: return "Planeado";
      case 2: return "En curso";
      case 3: return "Pausado";
      case 4: return "Finalizado";
      default: return estado;
    }
  };

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <table className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm">
      <thead>
        <tr className="bg-slate-800 text-left">
          <th className="p-3">Proyecto</th>
          <th className="p-3">Empresa</th>
          <th className="p-3">Estado</th>
          <th className="p-3">Inicio</th>
          <th className="p-3">Fin</th>
          <th className="p-3">Horas mensuales</th>
          <th className="p-3">Horas totales</th>
          <th className="p-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr key={p.id} className="border-b border-slate-800">
            <td className="p-3">{p.nombre}</td>
            <td className="p-3">{getCompanyName(p.empresaId)}</td>
            <td className="p-3">{getStatusLabel(p.estado)}</td>
            <td className="p-3">{formatDate(p.fechaInicio)}</td>
            <td className="p-3">{formatDate(p.fechaFin)}</td>
            <td className="p-3">
              {p.horasEstimadasMensuales != null
                ? `${p.horasEstimadasMensuales} hs`
                : "—"}
            </td>
            <td className="p-3">
              {p.horasEstimadasTotales != null
                ? `${p.horasEstimadasTotales} hs`
                : "—"}
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
              colSpan={8}
              className="p-3 text-center text-slate-500 italic"
            >
              Todavía no hay proyectos.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default ProjectsTable;
