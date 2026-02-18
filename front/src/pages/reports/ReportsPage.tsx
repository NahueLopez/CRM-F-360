import React, { useEffect, useState } from "react";
import { reportService } from "../../services/reportService";
import type { DashboardReport } from "../../types/report";

const statusLabels: Record<string, { text: string; color: string }> = {
  Planned: { text: "Planeado", color: "bg-slate-500" },
  InProgress: { text: "En curso", color: "bg-sky-500" },
  Paused: { text: "Pausado", color: "bg-amber-500" },
  Done: { text: "Finalizado", color: "bg-emerald-500" },
};

const priorityLabels: Record<string, { text: string; color: string }> = {
  Low: { text: "Baja", color: "bg-slate-500" },
  Medium: { text: "Media", color: "bg-sky-500" },
  High: { text: "Alta", color: "bg-orange-500" },
  Urgent: { text: "Urgente", color: "bg-red-500" },
};

const ReportsPage: React.FC = () => {
  const [data, setData] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const report = await reportService.getDashboard();
        setData(report);
      } catch (err) {
        console.error("Error loading report", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Cargando reportes...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-slate-500 text-sm">
        No se pudieron cargar los reportes.
      </div>
    );
  }

  const maxProjectHours = Math.max(
    ...data.hoursByProject.map((p) => Math.max(p.totalHours, p.estimatedHours)),
    1
  );
  const maxUserHours = Math.max(
    ...data.hoursByUser.map((u) => u.totalHours),
    1
  );

  return (
    <div className="space-y-8">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Empresas",
            value: data.totalCompanies,
            color: "text-emerald-400",
          },
          {
            label: "Proyectos",
            value: data.totalProjects,
            color: "text-sky-400",
          },
          {
            label: "Tareas",
            value: data.totalTasks,
            color: "text-violet-400",
          },
          {
            label: "Usuarios",
            value: data.totalUsers,
            color: "text-cyan-400",
          },
          {
            label: "Horas totales",
            value: `${data.totalHoursAllTime.toFixed(1)}`,
            color: "text-amber-400",
          },
          {
            label: "Horas este mes",
            value: `${data.totalHoursThisMonth.toFixed(1)}`,
            color: "text-indigo-400",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              {c.label}
            </p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Hours by Project ── */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">
            Horas por proyecto
          </h4>
          {data.hoursByProject.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No hay horas registradas.
            </p>
          ) : (
            <div className="space-y-3">
              {data.hoursByProject.map((p) => (
                <div key={p.projectId}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[60%]">
                      {p.projectName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {p.totalHours.toFixed(1)} / {p.estimatedHours > 0 ? `${p.estimatedHours} hs` : "—"}
                    </span>
                  </div>
                  <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(p.totalHours / maxProjectHours) * 100}%`,
                      }}
                    />
                    {p.estimatedHours > 0 && (
                      <div
                        className="absolute inset-y-0 w-0.5 bg-amber-400/80"
                        style={{
                          left: `${(p.estimatedHours / maxProjectHours) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {p.companyName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Hours by User ── */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">
            Horas por usuario
          </h4>
          {data.hoursByUser.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No hay horas registradas.
            </p>
          ) : (
            <div className="space-y-3">
              {data.hoursByUser.map((u) => (
                <div key={u.userId}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-slate-300 font-medium">
                      {u.userName}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] text-indigo-400">
                        {u.hoursThisMonth.toFixed(1)} este mes
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {u.totalHours.toFixed(1)} total
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(u.totalHours / maxUserHours) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Projects by Status ── */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">
            Proyectos por estado
          </h4>
          {data.projectsByStatus.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No hay proyectos.
            </p>
          ) : (
            <div className="space-y-2">
              {data.projectsByStatus.map((s) => {
                const label = statusLabels[s.status] ?? {
                  text: s.status,
                  color: "bg-slate-500",
                };
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${label.color}`} />
                    <span className="text-xs text-slate-300 flex-1">
                      {label.text}
                    </span>
                    <span className="text-sm font-semibold text-slate-200">
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tasks by Priority ── */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-slate-200 mb-4">
            Tareas por prioridad
          </h4>
          {data.tasksByPriority.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No hay tareas.
            </p>
          ) : (
            <div className="space-y-2">
              {data.tasksByPriority.map((t) => {
                const label = priorityLabels[t.priority] ?? {
                  text: t.priority,
                  color: "bg-slate-500",
                };
                const total = data.totalTasks || 1;
                return (
                  <div key={t.priority}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${label.color}`}
                        />
                        <span className="text-xs text-slate-300">
                          {label.text}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {t.count} ({((t.count / total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${label.color}`}
                        style={{ width: `${(t.count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
