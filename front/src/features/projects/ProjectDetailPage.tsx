import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { projectService } from "./projectService";
import { projectMemberService } from "./projectMemberService";
import { taskService } from "../tasks/taskService";
import { timeEntryService } from "../time-entries/timeEntryService";
import { activityService } from "../activities/activityService";
import type { Project } from "./types";
import type { ProjectMember } from "./memberTypes";
import type { Task } from "../tasks/types";
import type { TimeEntry } from "../time-entries/types";
import type { ActivityLog } from "../activities/types";

const PIE_COLORS = ["#6366f1", "#22d3ee", "#a78bfa", "#f59e0b", "#ef4444", "#10b981"];
const PRIORITY_COLORS: Record<string, string> = {
    Low: "#94a3b8", Medium: "#6366f1", High: "#f59e0b", Urgent: "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
    Planned: "Planificado", InProgress: "En progreso", Paused: "Pausado", Done: "Terminado",
};
const STATUS_COLORS: Record<string, string> = {
    Planned: "bg-slate-500", InProgress: "bg-indigo-500", Paused: "bg-amber-500", Done: "bg-emerald-500",
};

const ProjectDetailPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!projectId) return;
        const pid = Number(projectId);
        try {
            setLoading(true);
            const [proj, mem, tsk, te, act] = await Promise.all([
                projectService.getById(pid),
                projectMemberService.getByProject(pid),
                taskService.getByProject(pid),
                timeEntryService.getAll(),
                activityService.getByProject(pid),
            ]);
            setProject(proj);
            setMembers(mem);
            setTasks(tsk);
            // Filter time entries for this project
            setEntries(te.filter(e => e.projectName === proj.name));
            setActivities(act);
        } catch (err) {
            console.error("Error loading project", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { load(); }, [load]);

    // ── Derived data ──
    const totalHours = useMemo(() => entries.reduce((s, e) => s + e.hours, 0), [entries]);
    const estimatedHours = project?.estimatedHours ?? 0;
    const burnPercent = estimatedHours > 0 ? (totalHours / estimatedHours) * 100 : 0;

    // Hours per member
    const hoursByMember = useMemo(() => {
        const map = new Map<string, number>();
        entries.forEach(e => map.set(e.userName, (map.get(e.userName) ?? 0) + e.hours));
        return Array.from(map.entries())
            .map(([name, hours]) => ({ name, hours: Number(hours.toFixed(1)) }))
            .sort((a, b) => b.hours - a.hours);
    }, [entries]);

    // Tasks by column/status
    const tasksByColumn = useMemo(() => {
        const map = new Map<string, number>();
        tasks.forEach(t => {
            const col = t.columnName ?? "Sin columna";
            map.set(col, (map.get(col) ?? 0) + 1);
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    // Tasks by priority
    const tasksByPriority = useMemo(() => {
        const map = new Map<string, number>();
        tasks.forEach(t => map.set(t.priority, (map.get(t.priority) ?? 0) + 1));
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [tasks]);

    // Recent activities (last 10)
    const recentActivities = activities.slice(0, 10);

    const ACTIVITY_ICONS: Record<string, string> = {
        Call: "📞", Meeting: "🤝", Email: "📧", Note: "📝", StatusChange: "🔄",
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!project) {
        return <div className="text-center py-12 text-slate-500">Proyecto no encontrado.</div>;
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <Link to="/projects" className="text-xs text-slate-500 hover:text-slate-300 transition mb-1 inline-block">
                        ← Proyectos
                    </Link>
                    <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[project.status] ?? "bg-slate-500"}`} />
                        <span className="text-sm text-slate-400">{STATUS_LABELS[project.status] ?? project.status}</span>
                        {project.companyName && (
                            <span className="text-sm text-slate-600">· {project.companyName}</span>
                        )}
                    </div>
                    {project.description && (
                        <p className="text-sm text-slate-500 mt-2 max-w-xl">{project.description}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Link
                        to={`/projects/${projectId}/board`}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition"
                    >
                        📋 Tablero
                    </Link>
                    <Link
                        to={`/projects/${projectId}/activity`}
                        className="px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-700/50 text-sm font-medium transition"
                    >
                        📊 Actividad
                    </Link>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Equipo</p>
                    <p className="text-2xl font-bold text-white mt-1">{members.length}</p>
                    <p className="text-[10px] text-slate-600">miembros</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tareas</p>
                    <p className="text-2xl font-bold text-white mt-1">{tasks.length}</p>
                    <p className="text-[10px] text-slate-600">en total</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Registradas</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-1">{totalHours.toFixed(1)} hs</p>
                    <p className="text-[10px] text-slate-600">{entries.length} entradas</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estimadas</p>
                    <p className="text-2xl font-bold text-slate-300 mt-1">
                        {estimatedHours > 0 ? `${estimatedHours} hs` : "—"}
                    </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avance</p>
                    {estimatedHours > 0 ? (
                        <div className="mt-2">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${burnPercent > 100 ? "bg-red-500" : burnPercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                                            }`}
                                        style={{ width: `${Math.min(burnPercent, 100)}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-bold ${burnPercent > 100 ? "text-red-400" : "text-emerald-400"}`}>
                                    {burnPercent.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-2xl font-bold text-slate-600 mt-1">—</p>
                    )}
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Hours per member */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Horas por miembro</h3>
                    {hoursByMember.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={hoursByMember} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                                    labelStyle={{ color: "#e2e8f0" }}
                                    formatter={(val: number | undefined) => [`${val ?? 0} hs`, "Horas"]}
                                />
                                <Bar dataKey="hours" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-600 text-center py-8">Sin horas registradas</p>
                    )}
                </div>

                {/* Tasks by column */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Tareas por estado</h3>
                    {tasksByColumn.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={tasksByColumn}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name, value }) => `${name} (${value})`}
                                    labelLine={{ stroke: "#475569" }}
                                >
                                    {tasksByColumn.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                                />
                                <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-600 text-center py-8">Sin tareas</p>
                    )}
                </div>
            </div>

            {/* ── Team & Priority Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Team members */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Equipo ({members.length})</h3>
                    <div className="space-y-2">
                        {members.map(m => {
                            const memberHours = entries
                                .filter(e => e.userName === m.userName)
                                .reduce((s, e) => s + e.hours, 0);
                            const memberTasks = tasks.filter(t => t.assigneeName === m.userName).length;
                            return (
                                <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                                            {m.userName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium">{m.userName}</p>
                                            <p className="text-[10px] text-slate-500">{m.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="tabular-nums">{memberTasks} tareas</span>
                                        <span className="tabular-nums text-indigo-400 font-medium">{memberHours.toFixed(1)} hs</span>
                                    </div>
                                </div>
                            );
                        })}
                        {members.length === 0 && (
                            <p className="text-sm text-slate-600 text-center py-4">Sin miembros asignados</p>
                        )}
                    </div>
                </div>

                {/* Tasks by priority */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Tareas por prioridad</h3>
                    {tasksByPriority.length > 0 ? (
                        <div className="space-y-3 mt-2">
                            {tasksByPriority.map(({ name, value }) => {
                                const pct = tasks.length > 0 ? (value / tasks.length) * 100 : 0;
                                return (
                                    <div key={name} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-300">{name}</span>
                                            <span className="text-slate-500 tabular-nums">{value} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${pct}%`,
                                                    backgroundColor: PRIORITY_COLORS[name] ?? "#6366f1",
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600 text-center py-8">Sin tareas</p>
                    )}
                </div>
            </div>

            {/* ── Recent Activity ── */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-300">Actividad reciente</h3>
                    <Link
                        to={`/projects/${projectId}/activity`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                    >
                        Ver todo →
                    </Link>
                </div>
                {recentActivities.length > 0 ? (
                    <div className="space-y-2">
                        {recentActivities.map(a => (
                            <div key={a.id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-slate-800/50 transition">
                                <span className="text-base mt-0.5">{ACTIVITY_ICONS[a.type] ?? "📌"}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-200 truncate">{a.description}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {a.userName} · {new Date(a.createdAt).toLocaleDateString("es-AR")} {new Date(a.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-600 text-center py-6">Sin actividades registradas</p>
                )}
            </div>

            {/* ── Dates ── */}
            {(project.startDate || project.endDateEstimated) && (
                <div className="flex items-center gap-6 text-xs text-slate-500 px-1">
                    {project.startDate && (
                        <span>📅 Inicio: {new Date(project.startDate).toLocaleDateString("es-AR")}</span>
                    )}
                    {project.endDateEstimated && (
                        <span>🏁 Cierre estimado: {new Date(project.endDateEstimated).toLocaleDateString("es-AR")}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectDetailPage;
