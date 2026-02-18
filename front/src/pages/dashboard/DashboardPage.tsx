import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportService } from "../../services/reportService";
import { authStore } from "../../auth/authStore";
import type { DashboardReport } from "../../types/report";

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
            label: "Tareas",
            value: report?.totalTasks ?? 0,
            color: "text-violet-400",
            bg: "bg-violet-400/10 border-violet-500/20",
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
        <div className="space-y-8">
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
                    {/* Metric cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cards.map((c) => (
                            <button
                                key={c.label}
                                onClick={() => c.link && navigate(c.link)}
                                className={`border rounded-xl p-5 text-left transition hover:scale-[1.02] ${c.bg} ${c.link ? "cursor-pointer" : "cursor-default"
                                    }`}
                            >
                                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                                    {c.label}
                                </p>
                                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                            </button>
                        ))}
                    </div>

                    {/* Quick insights */}
                    {report && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top projects by hours */}
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                    Proyectos con más horas
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

                            {/* Top users by hours this month */}
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                    Usuarios activos este mes
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
                                        {report.hoursByUser.every((u) => u.hoursThisMonth === 0) && (
                                            <p className="text-xs text-slate-500 italic">
                                                Nadie cargó horas este mes.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardPage;
