import React, { useEffect, useMemo, useState } from "react";
import { taskService } from "../tasks/taskService";
import { projectService } from "../projects/projectService";
import type { Task } from "../tasks/types";
import type { Project } from "../projects/types";

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const priorityColors: Record<string, string> = {
    Urgent: "bg-red-500/80",
    High: "bg-orange-400/80",
    Medium: "bg-sky-400/80",
    Low: "bg-slate-500/80",
};

const CalendarPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [t, p] = await Promise.all([
                    taskService.getAll(),
                    projectService.getAll(),
                ]);
                setTasks(t);
                setProjects(p);
            } catch (err) {
                console.error("Error loading calendar", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const navigate = (dir: number) => {
        setCurrentDate(new Date(year, month + dir, 1));
    };

    const goToday = () => setCurrentDate(new Date());

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDow = firstDay.getDay(); // 0=Sun
        startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month padding
        for (let i = startDow - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month, -i),
                isCurrentMonth: false,
            });
        }

        // Current month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({
                date: new Date(year, month, d),
                isCurrentMonth: true,
            });
        }

        // Next month padding
        const remaining = 7 - (days.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                days.push({
                    date: new Date(year, month + 1, i),
                    isCurrentMonth: false,
                });
            }
        }

        return days;
    }, [year, month]);

    // Filter tasks
    const filteredTasks = useMemo(() => {
        if (selectedProjectId === "all") return tasks;
        return tasks.filter((t) => t.projectId === selectedProjectId);
    }, [tasks, selectedProjectId]);

    // Map tasks to dates
    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();
        for (const t of filteredTasks) {
            if (t.dueDate) {
                const key = t.dueDate.slice(0, 10);
                const arr = map.get(key) ?? [];
                arr.push(t);
                map.set(key, arr);
            }
        }
        // Also map projects by start/end dates
        return map;
    }, [filteredTasks]);

    // Map project milestones
    const milestonesByDate = useMemo(() => {
        const map = new Map<string, Project[]>();
        const filtered = selectedProjectId === "all" ? projects : projects.filter(p => p.id === selectedProjectId);
        for (const p of filtered) {
            if (p.startDate) {
                const key = p.startDate.slice(0, 10);
                const arr = map.get(key) ?? [];
                arr.push(p);
                map.set(key, arr);
            }
            if (p.endDateEstimated) {
                const key = p.endDateEstimated.slice(0, 10);
                const arr = map.get(key) ?? [];
                arr.push(p);
                map.set(key, arr);
            }
        }
        return map;
    }, [projects, selectedProjectId]);

    const todayKey = new Date().toISOString().slice(0, 10);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                Cargando calendario...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold">Calendario</h3>
                    <p className="text-sm text-slate-400">
                        Tareas por fecha de vencimiento e hitos de proyecto.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Project filter */}
                    <select
                        value={selectedProjectId}
                        onChange={(e) =>
                            setSelectedProjectId(e.target.value === "all" ? "all" : Number(e.target.value))
                        }
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
                    >
                        <option value="all">Todos los proyectos</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                <button
                    onClick={() => navigate(-1)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300
            hover:bg-slate-700 transition"
                >
                    ← Anterior
                </button>

                <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-white">
                        {MONTHS_ES[month]} {year}
                    </h4>
                    <button
                        onClick={goToday}
                        className="text-xs px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 transition"
                    >
                        Hoy
                    </button>
                </div>

                <button
                    onClick={() => navigate(1)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300
            hover:bg-slate-700 transition"
                >
                    Siguiente →
                </button>
            </div>

            {/* Calendar grid */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-700/50">
                    {DAYS_ES.map((day) => (
                        <div
                            key={day}
                            className="px-2 py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7">
                    {calendarDays.map(({ date, isCurrentMonth }, i) => {
                        const dateKey = date.toISOString().slice(0, 10);
                        const dayTasks = tasksByDate.get(dateKey) ?? [];
                        const dayMilestones = milestonesByDate.get(dateKey) ?? [];
                        const isToday = dateKey === todayKey;

                        return (
                            <div
                                key={i}
                                className={`min-h-[100px] border-b border-r border-slate-700/30 p-1.5
                  ${isCurrentMonth ? "bg-slate-900/20" : "bg-slate-900/50"}
                  ${isToday ? "ring-1 ring-inset ring-indigo-500/50 bg-indigo-500/5" : ""}
                `}
                            >
                                {/* Date number */}
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className={`text-xs font-medium px-1.5 py-0.5 rounded-full
                      ${isToday
                                                ? "bg-indigo-600 text-white"
                                                : isCurrentMonth
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }
                    `}
                                    >
                                        {date.getDate()}
                                    </span>
                                </div>

                                {/* Milestones */}
                                {dayMilestones.map((p) => {
                                    const isStart = p.startDate?.slice(0, 10) === dateKey;
                                    return (
                                        <div
                                            key={`milestone-${p.id}-${isStart ? "s" : "e"}`}
                                            className={`text-[9px] px-1.5 py-0.5 rounded mb-0.5 truncate font-medium
                        ${isStart
                                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                                }`}
                                            title={`${p.name}: ${isStart ? "Inicio" : "Fin estimado"}`}
                                        >
                                            {isStart ? "▶" : "◆"} {p.name}
                                        </div>
                                    );
                                })}

                                {/* Tasks */}
                                {dayTasks.slice(0, 3).map((t) => (
                                    <div
                                        key={t.id}
                                        className={`text-[9px] px-1.5 py-0.5 rounded mb-0.5 truncate text-white
                      ${priorityColors[t.priority] ?? priorityColors.Medium}`}
                                        title={`${t.title} (${t.priority}) — ${t.projectName}`}
                                    >
                                        {t.title}
                                    </div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <span className="text-[9px] text-slate-500 pl-1">
                                        +{dayTasks.length - 3} más
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500/50" /> Inicio proyecto
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500/50" /> Fin estimado
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/80" /> Urgente
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-400/80" /> Alta
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-400/80" /> Media
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-500/80" /> Baja
                </span>
            </div>
        </div>
    );
};

export default CalendarPage;
