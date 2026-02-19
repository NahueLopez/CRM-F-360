import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportService } from "../../services/reportService";
import { authStore } from "../../auth/authStore";
import type { DashboardReport } from "../../types/report";

const statusLabel: Record<string, { text: string; color: string }> = {
    Planned: { text: "Planeado", color: "text-slate-400" },
    InProgress: { text: "En curso", color: "text-sky-400" },
    Paused: { text: "Pausado", color: "text-amber-400" },
    Done: { text: "Finalizado", color: "text-emerald-400" },
};

const activityIcons: Record<string, string> = {
    Call: "📞",
    Meeting: "🤝",
    Email: "📧",
    Note: "📝",
    StatusChange: "🔄",
};

const DashboardPage: React.FC = () => {
    const [report, setReport] = useState<DashboardReport | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await reportService.getDashboard();
                setReport(data);
            } catch (err) {
                console.error("Error loading dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const cards = [
        {
            label: "Empresas",
            value: report?.totalCompanies ?? 0,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10 border-emerald-500/20",
            link: "/companies",
        },
        {
            label: "Proyectos",
            value: report?.totalProjects ?? 0,
            color: "text-sky-400",
            bg: "bg-sky-400/10 border-sky-500/20",
            link: "/projects",
        },
        {
            label: "Contactos",
            value: report?.totalContacts ?? 0,
            color: "text-violet-400",
            bg: "bg-violet-400/10 border-violet-500/20",
            link: "/contacts",
        },
        {
            label: "Tareas",
            value: report?.totalTasks ?? 0,
            color: "text-indigo-400",
            bg: "bg-indigo-400/10 border-indigo-500/20",
            link: undefined,
        },
        {
            label: "Tareas vencidas",
            value: report?.overdueTasks ?? 0,
            color: (report?.overdueTasks ?? 0) > 0 ? "text-red-400" : "text-emerald-400",
            bg: (report?.overdueTasks ?? 0) > 0
                ? "bg-red-400/10 border-red-500/20"
                : "bg-emerald-400/10 border-emerald-500/20",
            link: undefined,
        },
        {
            label: "Horas este mes",
            value: `${(report?.totalHoursThisMonth ?? 0).toFixed(1)} hs`,
            color: "text-amber-400",
            bg: "bg-amber-400/10 border-amber-500/20",
            link: "/time-entries",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">
                    Hola, {authStore.user?.fullName ?? "usuario"} 👋
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                    Resumen general de tu CRM F360.
                </p>
            </div>

            {loading ? (
                <div className="text-sm text-slate-500">Cargando métricas...</div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {cards.map((c) => (
                            <button
                                key={c.label}
                                onClick={() => c.link && navigate(c.link)}
                                className={`border rounded-xl p-4 text-left transition hover:scale-[1.02] ${c.bg} ${c.link ? "cursor-pointer" : "cursor-default"
                                    }`}
                            >
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                                    {c.label}
                                </p>
                                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                            </button>
                        ))}
                    </div>

                    {report && (
                        <>
                            {/* Project Health */}
                            {report.projectHealth.length > 0 && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-4">
                                        🏥 Salud de Proyectos
                                    </h4>
                                    <div className="space-y-3">
                                        {report.projectHealth.map((p) => {
                                            const burnColor =
                                                p.hoursBurnPercent > 90
                                                    ? "bg-red-500"
                                                    : p.hoursBurnPercent > 70
                                                        ? "bg-amber-500"
                                                        : "bg-emerald-500";
                                            const st = statusLabel[p.status] ?? statusLabel.Planned;
                                            return (
                                                <div key={p.projectId} className="flex items-center gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-baseline gap-2 mb-1">
                                                            <span className="text-sm font-medium truncate">
                                                                {p.projectName}
                                                            </span>
                                                            <span className={`text-[10px] ${st.color}`}>
                                                                {st.text}
                                                            </span>
                                                            {p.overdueTasks > 0 && (
                                                                <span className="text-[10px] text-red-400 font-medium">
                                                                    ⚠ {p.overdueTasks} vencidas
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Progress bar */}
                                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${burnColor}`}
                                                                style={{
                                                                    width: `${Math.min(p.hoursBurnPercent, 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 w-28">
                                                        <span className="text-xs text-slate-300">
                                                            {p.loggedHours.toFixed(1)}{" / "}
                                                            {p.estimatedHours > 0
                                                                ? `${p.estimatedHours} hs`
                                                                : "—"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 block">
                                                            {p.hoursBurnPercent.toFixed(0)}% consumido
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Top projects by hours */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                        ⏱ Proyectos con más horas
                                    </h4>
                                    {report.hoursByProject.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">
                                            No hay horas registradas todavía.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {report.hoursByProject.slice(0, 5).map((p) => (
                                                <div
                                                    key={p.projectId}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div className="truncate max-w-[65%]">
                                                        <span className="text-xs text-slate-300">
                                                            {p.projectName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-600 ml-1">
                                                            ({p.companyName})
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-indigo-400">
                                                        {p.totalHours.toFixed(1)} hs
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Users active this month */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                        👥 Usuarios activos este mes
                                    </h4>
                                    {report.hoursByUser.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">
                                            No hay horas registradas todavía.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {report.hoursByUser
                                                .filter((u) => u.hoursThisMonth > 0)
                                                .slice(0, 5)
                                                .map((u) => (
                                                    <div
                                                        key={u.userId}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <span className="text-xs text-slate-300">
                                                            {u.userName}
                                                        </span>
                                                        <span className="text-xs font-semibold text-emerald-400">
                                                            {u.hoursThisMonth.toFixed(1)} hs
                                                        </span>
                                                    </div>
                                                ))}
                                            {report.hoursByUser.every(
                                                (u) => u.hoursThisMonth === 0
                                            ) && (
                                                    <p className="text-xs text-slate-500 italic">
                                                        Nadie cargó horas este mes.
                                                    </p>
                                                )}
                                        </div>
                                    )}
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                        📋 Actividad reciente
                                    </h4>
                                    {report.recentActivity.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">
                                            Sin actividad reciente.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {report.recentActivity.map((a) => (
                                                <div key={a.id} className="flex gap-2 items-start">
                                                    <span className="text-sm shrink-0">
                                                        {activityIcons[a.type] ?? "📌"}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-300 truncate">
                                                            {a.description}
                                                        </p>
                                                        <p className="text-[10px] text-slate-600">
                                                            {a.userName}
                                                            {a.entityName ? ` · ${a.entityName}` : ""} ·{" "}
                                                            {new Date(a.createdAt).toLocaleDateString(
                                                                "es-AR",
                                                                { day: "2-digit", month: "short" }
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status & Priority row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Projects by status */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                        📊 Proyectos por estado
                                    </h4>
                                    <div className="flex gap-3 flex-wrap">
                                        {report.projectsByStatus.map((s) => {
                                            const st = statusLabel[s.status] ?? statusLabel.Planned;
                                            return (
                                                <div
                                                    key={s.status}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-center"
                                                >
                                                    <p className={`text-lg font-bold ${st.color}`}>
                                                        {s.count}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">{st.text}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tasks by priority */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                        🎯 Tareas por prioridad
                                    </h4>
                                    <div className="flex gap-3 flex-wrap">
                                        {report.tasksByPriority.map((p) => {
                                            const colors: Record<string, string> = {
                                                Urgent: "text-red-400",
                                                High: "text-orange-400",
                                                Medium: "text-amber-400",
                                                Low: "text-slate-400",
                                            };
                                            return (
                                                <div
                                                    key={p.priority}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-center"
                                                >
                                                    <p
                                                        className={`text-lg font-bold ${colors[p.priority] ?? "text-slate-400"
                                                            }`}
                                                    >
                                                        {p.count}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {p.priority}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardPage;
