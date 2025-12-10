import React from "react";

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Reportes</h3>
      <p className="text-sm text-slate-300">
        Acá vas a ver horas totales por proyecto, por usuario, etc.
      </p>
      <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">
        Después le metemos sumatorias y, si querés, gráficos.
      </div>
    </div>
  );
};

export default ReportsPage;
