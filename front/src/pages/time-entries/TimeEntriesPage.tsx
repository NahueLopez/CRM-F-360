import React from "react";

const TimeEntriesPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Carga de horas</h3>
      <p className="text-sm text-slate-300">
        Acá cada usuario va a poder cargar sus horas por proyecto.
      </p>
      <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">
        Más adelante armamos el formulario de carga y la tabla.
      </div>
    </div>
  );
};

export default TimeEntriesPage;
