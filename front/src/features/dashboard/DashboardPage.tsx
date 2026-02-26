import { useNavigate } from "react-router-dom";
import { authStore } from "../../shared/auth/authStore";
import { useDashboard } from "../../shared/hooks/useDashboardQuery";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    CartesianGrid,
} from "recharts";

// ── Extracted sub-components ──
import ChartCard, { EmptyChart } from "./components/ChartCard";
import DashboardSkeleton from "./components/DashboardSkeleton";
import {
    statusLabel, activityIcons, CHART_COLORS,
    STATUS_COLORS, PRIORITY_COLORS, CustomTooltipStyle,
} from "./dashboardConstants";

/* ── Helpers ── */
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
};

const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});

/* ── Main Component ── */
const DashboardPage = () => {
    // React Query — replaces manual useState + useEffect
    const { data: report, isLoading: loading } = useDashboard();
    const navigate = useNavigate();

    /* ── KPI Cards ── */
    const cards = [
        {
            label: "Empresas", value: report?.totalCompanies ?? 0,
            gradient: "from-emerald-500/15 to-emerald-600/5", accent: "text-emerald-400",
            border: "border-emerald-500/20", icon: "🏢", link: "/companies",
        },
        {
            label: "Proyectos", value: report?.totalProjects ?? 0,
            gradient: "from-sky-500/15 to-sky-600/5", accent: "text-sky-400",
            border: "border-sky-500/20", icon: "📁", link: "/projects",
        },
        {
            label: "Contactos", value: report?.totalContacts ?? 0,
            gradient: "from-violet-500/15 to-violet-600/5", accent: "text-violet-400",
            border: "border-violet-500/20", icon: "👤", link: "/contacts",
        },
        {
            label: "Tareas", value: report?.totalTasks ?? 0,
            gradient: "from-indigo-500/15 to-indigo-600/5", accent: "text-indigo-400",
            border: "border-indigo-500/20", icon: "✅", link: undefined,
        },
        {
            label: "Vencidas", value: report?.overdueTasks ?? 0,
            gradient: (report?.overdueTasks ?? 0) > 0 ? "from-red-500/15 to-red-600/5" : "from-emerald-500/15 to-emerald-600/5",
            accent: (report?.overdueTasks ?? 0) > 0 ? "text-red-400" : "text-emerald-400",
            border: (report?.overdueTasks ?? 0) > 0 ? "border-red-500/20" : "border-emerald-500/20",
            icon: (report?.overdueTasks ?? 0) > 0 ? "⚠️" : "✨", link: undefined,
        },
        {
            label: "Horas mes", value: `${(report?.totalHoursThisMonth ?? 0).toFixed(1)}h`,
            gradient: "from-amber-500/15 to-amber-600/5", accent: "text-amber-400",
            border: "border-amber-500/20", icon: "⏱", link: "/time-entries",
        },
    ];

    /* ── Chart data ── */
    const hoursBarData = (report?.hoursByProject ?? []).slice(0, 6).map(p => ({
        name: p.projectName.length > 14 ? p.projectName.slice(0, 14) + "…" : p.projectName,
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

    const healthData = report?.projectHealth ?? [];

    return (
        <div className="space-y-6">
            {/* ═══════════ HEADER ═══════════ */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600/10 via-violet-600/5 to-transparent border border-slate-700/30 p-6">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-violet-500/5 rounded-full translate-y-1/2 blur-3xl" />

                <div className="relative flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {getGreeting()}, {authStore.user?.fullName?.split(" ")[0] ?? "usuario"} 👋
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 capitalize">{today}</p>
                    </div>
                    {report && (
                        <div className="hidden sm:flex items-center gap-6 text-xs text-slate-500">
                            <div className="text-center">
                                <p className="text-lg font-bold text-white tabular-nums">{report.totalHoursAllTime.toFixed(0)}</p>
                                <p>horas totales</p>
                            </div>
                            <div className="w-px h-8 bg-slate-700/60" />
                            <div className="text-center">
                                <p className="text-lg font-bold text-white tabular-nums">{report.totalUsers}</p>
                                <p>usuarios</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <>
                    {/* ═══════════ KPI CARDS ═══════════ */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {cards.map(c => (
                            <button
                                key={c.label}
                                onClick={() => c.link && navigate(c.link)}
                                className={`group relative overflow-hidden rounded-2xl border ${c.border} bg-gradient-to-br ${c.gradient}
                                    p-4 text-left transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]
                                    hover:shadow-lg hover:shadow-black/20 ${c.link ? "cursor-pointer" : "cursor-default"}`}
                            >
                                {/* Glow on hover */}
                                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{c.label}</span>
                                        <span className="text-sm opacity-80 group-hover:scale-110 transition-transform">{c.icon}</span>
                                    </div>
                                    <p className={`text-2xl font-bold ${c.accent} tabular-nums`}>{c.value}</p>
                                </div>

                                {/* Subtle bottom accent line */}
                                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                            </button>
                        ))}
                    </div>

                    {report && (
                        <>
                            {/* ═══════════ ROW 1: Charts ═══════════ */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Hours by Project */}
                                <ChartCard title="Horas por proyecto" subtitle="Horas reales vs estimadas" icon="⏱">
                                    {hoursBarData.length === 0 ? (
                                        <EmptyChart message="Sin horas registradas" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height={230}>
                                            <BarChart data={hoursBarData} barGap={2}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.10)" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={30} />
                                                <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                                                <Bar dataKey="estimadas" fill="rgba(129,140,248,0.15)" radius={[6, 6, 0, 0]} maxBarSize={28} name="Estimadas" />
                                                <Bar dataKey="horas" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={28} name="Reales" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </ChartCard>

                                {/* Projects by Status — Donut */}
                                <ChartCard title="Proyectos por estado" subtitle={`${report.totalProjects} proyectos`} icon="📊">
                                    {statusPieData.length === 0 ? (
                                        <EmptyChart message="Sin proyectos" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height={230}>
                                            <PieChart>
                                                <Pie
                                                    data={statusPieData}
                                                    cx="50%" cy="45%"
                                                    innerRadius={55} outerRadius={85}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                    animationBegin={200}
                                                    animationDuration={800}
                                                >
                                                    {statusPieData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={CustomTooltipStyle} />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    iconType="circle"
                                                    iconSize={7}
                                                    formatter={(value: string) => (
                                                        <span style={{ color: "#94a3b8", fontSize: 11 }}>{value}</span>
                                                    )}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </ChartCard>

                                {/* Tasks by Priority */}
                                <ChartCard title="Tareas por prioridad" subtitle={`${report.totalTasks} tareas totales`} icon="🎯">
                                    {priorityBarData.length === 0 ? (
                                        <EmptyChart message="Sin tareas" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height={230}>
                                            <BarChart data={priorityBarData} layout="vertical" barSize={16}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.10)" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={50} />
                                                <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                                                <Bar dataKey="cantidad" radius={[0, 8, 8, 0]}>
                                                    {priorityBarData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </ChartCard>
                            </div>

                            {/* ═══════════ ROW 2: Health + Users ═══════════ */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                {/* Project Health — 3 col */}
                                <div className="lg:col-span-3">
                                    <ChartCard title="Salud de proyectos" subtitle="Progreso, tareas y burn de horas" icon="🏥">
                                        {healthData.length === 0 ? (
                                            <EmptyChart message="Sin proyectos activos" />
                                        ) : (
                                            <div className="space-y-3">
                                                {healthData.slice(0, 5).map(p => {
                                                    const taskPercent = p.totalTasks > 0 ? (p.completedTasks / p.totalTasks) * 100 : 0;
                                                    const burnPercent = Math.min(p.hoursBurnPercent, 100);
                                                    const burnColor = p.hoursBurnPercent > 90 ? "from-red-500 to-red-400" : p.hoursBurnPercent > 70 ? "from-amber-500 to-amber-400" : "from-emerald-500 to-emerald-400";
                                                    const statusInfo = statusLabel[p.status] ?? { text: p.status, dot: "bg-slate-400" };

                                                    return (
                                                        <div key={p.projectId} className="group p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-700/60 transition-all">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                                                                    <span className="text-sm font-medium text-slate-200">{p.projectName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                                    <span>{p.completedTasks}/{p.totalTasks} tareas</span>
                                                                    {p.overdueTasks > 0 && (
                                                                        <span className="text-red-400 font-medium">⚠ {p.overdueTasks} vencidas</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Dual progress bars */}
                                                            <div className="space-y-2">
                                                                {/* Tasks progress */}
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="text-[9px] text-slate-600 w-14">Tareas</span>
                                                                    <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
                                                                            style={{ width: `${taskPercent}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-500 w-10 text-right tabular-nums">{taskPercent.toFixed(0)}%</span>
                                                                </div>
                                                                {/* Hours burn */}
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="text-[9px] text-slate-600 w-14">Horas</span>
                                                                    <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full bg-gradient-to-r ${burnColor} transition-all duration-700`}
                                                                            style={{ width: `${burnPercent}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-[10px] w-10 text-right tabular-nums ${p.hoursBurnPercent > 90 ? "text-red-400" : "text-slate-500"}`}>
                                                                        {p.hoursBurnPercent.toFixed(0)}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </ChartCard>
                                </div>

                                {/* Hours by User — 2 col */}
                                <div className="lg:col-span-2">
                                    <ChartCard title="Horas por usuario" subtitle="Este mes" icon="👥">
                                        {usersBarData.length === 0 ? (
                                            <EmptyChart message="Nadie cargó horas" />
                                        ) : (
                                            <div className="space-y-2.5">
                                                {(() => {
                                                    const filtered = (report?.hoursByUser ?? []).filter(u => u.hoursThisMonth > 0).slice(0, 7);
                                                    const max = Math.max(...filtered.map(x => x.hoursThisMonth), 0);
                                                    return filtered.map((u, i) => {
                                                        const pct = max > 0 ? (u.hoursThisMonth / max) * 100 : 0;
                                                        return (
                                                            <div key={u.userId} className="flex items-center gap-3">
                                                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0">
                                                                    {u.userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="text-xs text-slate-300 truncate">{u.userName}</span>
                                                                        <span className="text-xs font-medium text-slate-400 tabular-nums">{u.hoursThisMonth.toFixed(1)}h</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-700"
                                                                            style={{
                                                                                width: `${pct}%`,
                                                                                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </ChartCard>
                                </div>
                            </div>

                            {/* ═══════════ ROW 3: Activity Timeline ═══════════ */}
                            <ChartCard title="Actividad reciente" subtitle="Últimas interacciones registradas" icon="📋">
                                {report.recentActivity.length === 0 ? (
                                    <p className="text-xs text-slate-600 text-center py-8">Sin actividad reciente</p>
                                ) : (
                                    <div className="relative">
                                        {/* Timeline line */}
                                        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-700/60 via-slate-700/30 to-transparent" />

                                        <div className="space-y-1">
                                            {report.recentActivity.slice(0, 12).map((a, idx) => {
                                                const icon = activityIcons[a.type] ?? "📌";
                                                return (
                                                    <div
                                                        key={a.id}
                                                        className="relative flex items-start gap-3 pl-1 py-2 rounded-lg hover:bg-slate-800/40 transition-colors group"
                                                        style={{ animationDelay: `${idx * 50}ms` }}
                                                    >
                                                        {/* Timeline dot */}
                                                        <div className="relative z-10 w-[30px] h-[30px] rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs shrink-0 group-hover:border-indigo-500/40 transition-colors">
                                                            {icon}
                                                        </div>

                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                            <p className="text-xs text-slate-300">{a.description}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] text-indigo-400/70">{a.userName}</span>
                                                                {a.entityName && (
                                                                    <>
                                                                        <span className="text-[10px] text-slate-700">·</span>
                                                                        <span className="text-[10px] text-slate-500">{a.entityName}</span>
                                                                    </>
                                                                )}
                                                                <span className="text-[10px] text-slate-700">·</span>
                                                                <span className="text-[10px] text-slate-600">
                                                                    {new Date(a.createdAt).toLocaleDateString("es-AR", {
                                                                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </ChartCard>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardPage;

