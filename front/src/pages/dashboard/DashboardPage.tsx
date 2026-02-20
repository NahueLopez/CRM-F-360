import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportService } from "../../services/reportService";
import { authStore } from "../../auth/authStore";
import type { DashboardReport } from "../../types/report";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    CartesianGrid,
} from "recharts";

const statusLabel: Record<string, { text: string; color: string }> = {
    Planned: { text: "Planeado", color: "text-slate-400" },
    InProgress: { text: "En curso", color: "text-sky-400" },
    Paused: { text: "Pausado", color: "text-amber-400" },
    Done: { text: "Finalizado", color: "text-emerald-400" },
};

const activityIcons: Record<string, string> = {
    Call: "📞", Meeting: "🤝", Email: "📧", Note: "📝", StatusChange: "🔄",
};

const CHART_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];
const STATUS_COLORS: Record<string, string> = {
    Planned: "#94a3b8", InProgress: "#0ea5e9", Paused: "#f59e0b", Done: "#10b981",
};
const PRIORITY_COLORS: Record<string, string> = {
    Low: "#94a3b8", Medium: "#f59e0b", High: "#f97316", Urgent: "#ef4444",
};

const CustomTooltipStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(100, 116, 139, 0.3)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#e2e8f0",
};

const DashboardPage: React.FC = () => {
    const [report, setReport] = useState<DashboardReport | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const data = await reportService.getDashboard();
                setReport(data);
            } catch (err) {
                console.error("Error loading dashboard", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const cards = [
        { label: "Empresas", value: report?.totalCompanies ?? 0, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-500/20", icon: "🏢", link: "/companies" },
        { label: "Proyectos", value: report?.totalProjects ?? 0, color: "text-sky-400", bg: "bg-sky-400/10 border-sky-500/20", icon: "📁", link: "/projects" },
        { label: "Contactos", value: report?.totalContacts ?? 0, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-500/20", icon: "👤", link: "/contacts" },
        { label: "Tareas", value: report?.totalTasks ?? 0, color: "text-indigo-400", bg: "bg-indigo-400/10 border-indigo-500/20", icon: "✅", link: undefined },
        { label: "Vencidas", value: report?.overdueTasks ?? 0, color: (report?.overdueTasks ?? 0) > 0 ? "text-red-400" : "text-emerald-400", bg: (report?.overdueTasks ?? 0) > 0 ? "bg-red-400/10 border-red-500/20" : "bg-emerald-400/10 border-emerald-500/20", icon: "⚠️", link: undefined },
        { label: "Horas mes", value: `${(report?.totalHoursThisMonth ?? 0).toFixed(1)}h`, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-500/20", icon: "⏱", link: "/time-entries" },
    ];

    /* ── Chart data transforms ── */
    const hoursBarData = (report?.hoursByProject ?? []).slice(0, 6).map(p => ({
        name: p.projectName.length > 12 ? p.projectName.slice(0, 12) + "…" : p.projectName,
        horas: Number(p.totalHours.toFixed(1)),
        estimadas: p.estimatedHours,
    }));

    const statusPieData = (report?.projectsByStatus ?? []).map(s => ({
        name: statusLabel[s.status]?.text ?? s.status,
        value: s.count,
        color: STATUS_COLORS[s.status] ?? "#94a3b8",
    }));

    const priorityBarData = (report?.tasksByPriority ?? []).map(p => ({
        name: p.priority,
        cantidad: p.count,
        color: PRIORITY_COLORS[p.priority] ?? "#94a3b8",
    }));

    const usersBarData = (report?.hoursByUser ?? [])
        .filter(u => u.hoursThisMonth > 0)
        .slice(0, 8)
        .map(u => ({
            name: u.userName.split(" ")[0],
            horas: Number(u.hoursThisMonth.toFixed(1)),
        }));

    const healthData = (report?.projectHealth ?? []).map(p => ({
        name: p.projectName.length > 12 ? p.projectName.slice(0, 12) + "…" : p.projectName,
        completadas: p.completedTasks,
        total: p.totalTasks,
        vencidas: p.overdueTasks,
        consumido: Number(p.hoursBurnPercent.toFixed(0)),
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
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
                        {cards.map(c => (
                            <button
                                key={c.label}
                                onClick={() => c.link && navigate(c.link)}
                                className={`border rounded-xl p-4 text-left transition hover:scale-[1.02] active:scale-[0.98] ${c.bg} ${c.link ? "cursor-pointer" : "cursor-default"}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{c.label}</span>
                                    <span className="text-sm">{c.icon}</span>
                                </div>
                                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                            </button>
                        ))}
                    </div>

                    {report && (
                        <>
                            {/* Row 1: Hours by Project + Projects by Status + Tasks by Priority */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Hours by project (bar chart) */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-4">
                                        ⏱ Horas por proyecto
                                    </h4>
                                    {hoursBarData.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic h-48 flex items-center justify-center">Sin horas registradas</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={hoursBarData} barGap={2}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={35} />
                                                <Tooltip contentStyle={CustomTooltipStyle} />
                                                <Bar dataKey="horas" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                                <Bar dataKey="estimadas" fill="rgba(99,102,241,0.2)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                {/* Projects by status (pie chart) */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-4">
                                        📊 Proyectos por estado
                                    </h4>
                                    {statusPieData.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic h-48 flex items-center justify-center">Sin proyectos</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <PieChart>
                                                <Pie
                                                    data={statusPieData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={50} outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {statusPieData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={CustomTooltipStyle} />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    iconType="circle"
                                                    iconSize={8}
                                                    formatter={(value: string) => <span style={{ color: "#cbd5e1", fontSize: 11 }}>{value}</span>}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                {/* Tasks by priority (bar chart) */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-4">
                                        🎯 Tareas por prioridad
                                    </h4>
                                    {priorityBarData.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic h-48 flex items-center justify-center">Sin tareas</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={priorityBarData} layout="vertical" barSize={18}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={55} />
                                                <Tooltip contentStyle={CustomTooltipStyle} />
                                                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                                                    {priorityBarData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Project Health + Users activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Project health (stacked area) */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-4">
                                        🏥 Salud de proyectos
                                    </h4>
                                    {healthData.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic h-56 flex items-center justify-center">Sin proyectos activos</p>
                                    ) : (
                                        <>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <BarChart data={healthData} barGap={2}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
                                                    <Tooltip contentStyle={CustomTooltipStyle} />
                                                    <Bar dataKey="completadas" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={24} name="Completadas" />
                                                    <Bar dataKey="vencidas" stackId="b" fill="#ef4444" radius={[0, 0, 0, 0]} maxBarSize={24} name="Vencidas" />
                                                    <Bar dataKey="total" fill="rgba(99,102,241,0.3)" radius={[4, 4, 0, 0]} maxBarSize={24} name="Total" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            {/* Burn progress bars */}
                                            <div className="mt-4 space-y-2">
                                                {report.projectHealth.slice(0, 4).map(p => {
                                                    const burnColor = p.hoursBurnPercent > 90 ? "bg-red-500" : p.hoursBurnPercent > 70 ? "bg-amber-500" : "bg-emerald-500";
                                                    return (
                                                        <div key={p.projectId} className="flex items-center gap-3">
                                                            <span className="text-[10px] text-slate-400 w-24 truncate">{p.projectName}</span>
                                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all ${burnColor}`}
                                                                    style={{ width: `${Math.min(p.hoursBurnPercent, 100)}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 w-10 text-right">{p.hoursBurnPercent.toFixed(0)}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Users hours this month (bar) */}
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                    <h4 className="text-sm font-semibold text-slate-200 mb-4">
                                        👥 Horas por usuario este mes
                                    </h4>
                                    {usersBarData.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic h-56 flex items-center justify-center">Nadie cargó horas este mes</p>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={usersBarData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} />
                                                <Tooltip contentStyle={CustomTooltipStyle} formatter={(value: unknown) => [`${value} hs`, "Horas"]} />
                                                <Bar dataKey="horas" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                                    {usersBarData.map((_, i) => (
                                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Row 3: Recent Activity */}
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                                <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                    📋 Actividad reciente
                                </h4>
                                {report.recentActivity.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">Sin actividad reciente.</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {report.recentActivity.map(a => (
                                            <div key={a.id} className="flex gap-2 items-start bg-slate-800/30 rounded-lg p-3 border border-slate-700/20">
                                                <span className="text-sm shrink-0">{activityIcons[a.type] ?? "📌"}</span>
                                                <div className="min-w-0">
                                                    <p className="text-xs text-slate-300 truncate">{a.description}</p>
                                                    <p className="text-[10px] text-slate-600">
                                                        {a.userName}{a.entityName ? ` · ${a.entityName}` : ""} · {new Date(a.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardPage;
