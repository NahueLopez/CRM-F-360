import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { activityService } from "../activities/activityService";
import { projectService } from "../projects/projectService";
import type { ActivityLog } from "../activities/types";
import type { Project } from "../projects/types";

const ACTIVITY_ICONS: Record<string, string> = {
    Call: "📞",
    Meeting: "🤝",
    Email: "📧",
    Note: "📝",
    StatusChange: "🔄",
};

const ACTIVITY_COLORS: Record<string, string> = {
    Call: "border-sky-500/50 bg-sky-500/10",
    Meeting: "border-violet-500/50 bg-violet-500/10",
    Email: "border-amber-500/50 bg-amber-500/10",
    Note: "border-slate-500/50 bg-slate-500/10",
    StatusChange: "border-emerald-500/50 bg-emerald-500/10",
};

const ProjectActivityPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("");

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const [acts, proj] = await Promise.all([
                activityService.getByProject(Number(projectId)),
                projectService.getById(Number(projectId)),
            ]);
            setActivities(acts);
            setProject(proj);
        } catch (err) {
            console.error("Error loading project activities", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    const filteredActivities = filterType
        ? activities.filter(a => a.type === filterType)
        : activities;

    // Group by date
    const groupedByDate = filteredActivities.reduce<Record<string, ActivityLog[]>>((acc, a) => {
        const dateKey = new Date(a.createdAt).toLocaleDateString("es-AR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(a);
        return acc;
    }, {});

    const activityTypes = [...new Set(activities.map(a => a.type))].sort();

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            to="/projects"
                            className="text-xs text-slate-500 hover:text-slate-300 transition"
                        >
                            ← Proyectos
                        </Link>
                        {project && (
                            <Link
                                to={`/projects/${projectId}/board`}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                            >
                                · Tablero
                            </Link>
                        )}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">
                        {project?.name ?? "Proyecto"} — Actividad
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Timeline de todo lo que pasó en este proyecto
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                    >
                        <option value="">Todos los tipos</option>
                        {activityTypes.map(type => (
                            <option key={type} value={type}>
                                {ACTIVITY_ICONS[type] ?? "📌"} {type}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {["Call", "Meeting", "Email", "Note", "StatusChange"].map(type => {
                    const count = activities.filter(a => a.type === type).length;
                    return (
                        <button
                            key={type}
                            onClick={() => setFilterType(filterType === type ? "" : type)}
                            className={`rounded-xl p-3 border transition text-left ${filterType === type
                                    ? "border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30"
                                    : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50"
                                }`}
                        >
                            <p className="text-lg">{ACTIVITY_ICONS[type]}</p>
                            <p className="text-xl font-bold text-white mt-1">{count}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{type === "StatusChange" ? "Cambios" : type + "s"}</p>
                        </button>
                    );
                })}
            </div>

            {/* Timeline */}
            {Object.keys(groupedByDate).length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p className="text-3xl mb-2">📭</p>
                    <p>No hay actividades registradas para este proyecto.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByDate).map(([dateLabel, acts]) => (
                        <div key={dateLabel}>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 capitalize">
                                {dateLabel}
                            </h3>
                            <div className="relative pl-6 border-l-2 border-slate-700/50 space-y-3">
                                {acts.map(a => (
                                    <div key={a.id} className="relative">
                                        {/* Dot on timeline */}
                                        <div className="absolute -left-[25px] top-3 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-600" />

                                        <div
                                            className={`rounded-xl p-4 border transition-all hover:translate-x-1 ${ACTIVITY_COLORS[a.type] ?? "border-slate-700/50 bg-slate-800/30"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <span className="text-lg flex-shrink-0 mt-0.5">
                                                        {ACTIVITY_ICONS[a.type] ?? "📌"}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white font-medium">{a.description}</p>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                            <span>{a.userName}</span>
                                                            {a.contactName && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="text-slate-400">{a.contactName}</span>
                                                                </>
                                                            )}
                                                            {a.companyName && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="text-slate-400">{a.companyName}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-600 tabular-nums flex-shrink-0 mt-1">
                                                    {new Date(a.createdAt).toLocaleTimeString("es-AR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectActivityPage;
