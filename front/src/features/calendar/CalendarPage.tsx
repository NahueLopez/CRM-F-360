import React, { useEffect, useMemo, useState } from "react";
import { taskService } from "../tasks/taskService";
import { projectService } from "../projects/projectService";
import { useRooms, useReservations, useCreateReservation, useDeleteReservation } from "../../shared/hooks/useRoomQuery";
import { useToast } from "../../shared/context/ToastContext";
import { authStore } from "../../shared/auth/authStore";
import type { Task } from "../tasks/types";
import type { Project } from "../projects/types";
import type { CreateReservationDto } from "../rooms/types";

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

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
    const h = String(i).padStart(2, "0");
    return [`${h}:00`, `${h}:30`];
}).flat().slice(14, 40); // 07:00 – 20:00



const CalendarPage: React.FC = () => {
    const { addToast } = useToast();
    const isManager = authStore.hasAnyRole("Admin", "Manager");

    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");

    // ── Day panel state ──
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [showReserveForm, setShowReserveForm] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);

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

    // ── Room reservations for selected day ──
    const { data: rooms = [] } = useRooms();
    const { data: dayReservations = [] } = useReservations(selectedDay ?? "");
    const createReservation = useCreateReservation();
    const deleteReservation = useDeleteReservation();

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

    // ── Reservation handlers ──
    const handleReserve = async (dto: CreateReservationDto) => {
        try {
            await createReservation.mutateAsync(dto);
            addToast("success", "Sala reservada correctamente");
            setShowReserveForm(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al reservar";
            addToast("error", msg.includes("reservada") ? msg : "Error al crear la reserva");
        }
    };

    const handleCancelReservation = async (id: number) => {
        if (!confirm("¿Cancelar esta reserva?")) return;
        try {
            await deleteReservation.mutateAsync(id);
            addToast("success", "Reserva cancelada");
        } catch { addToast("error", "Error al cancelar"); }
    };

    const handleQuickAddTask = async (data: { projectId: number; title: string; priority: string }) => {
        try {
            await taskService.create({
                projectId: data.projectId,
                title: data.title,
                priority: data.priority,
                dueDate: selectedDay ?? undefined,
            });
            // Refresh tasks
            const t = await taskService.getAll();
            setTasks(t);
            addToast("success", "Tarea creada");
            setShowAddTask(false);
        } catch { addToast("error", "Error al crear tarea"); }
    };

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
                        Tareas, hitos de proyecto y reservas de salas.
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

            {/* Main layout: calendar + side panel */}
            <div className={`flex gap-4 ${selectedDay ? "" : ""}`}>
                {/* Calendar grid */}
                <div className={`bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden transition-all ${selectedDay ? "flex-1" : "w-full"}`}>
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
                            const isSelected = dateKey === selectedDay;

                            return (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setSelectedDay(dateKey === selectedDay ? null : dateKey);
                                        setShowReserveForm(false);
                                    }}
                                    className={`min-h-[100px] border-b border-r border-slate-700/30 p-1.5 cursor-pointer transition-all
                  ${isCurrentMonth ? "bg-slate-900/20 hover:bg-slate-800/40" : "bg-slate-900/50"}
                  ${isToday ? "ring-1 ring-inset ring-indigo-500/50 bg-indigo-500/5" : ""}
                  ${isSelected ? "ring-2 ring-inset ring-indigo-500 bg-indigo-500/10" : ""}
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

                {/* ── Side panel: Day detail ── */}
                {selectedDay && (
                    <div className="w-80 shrink-0 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-4 self-start sticky top-4">
                        {/* Panel header */}
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-200 capitalize">
                                {new Date(selectedDay + "T12:00:00").toLocaleDateString("es-AR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                })}
                            </h4>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="text-slate-500 hover:text-slate-300 text-xs transition"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Reservations section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                                    🚪 Reservas de sala
                                </span>
                                <button
                                    onClick={() => setShowReserveForm(!showReserveForm)}
                                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition"
                                >
                                    {showReserveForm ? "Cancelar" : "+ Reservar"}
                                </button>
                            </div>

                            {/* Reserve form */}
                            {showReserveForm && (
                                <ReserveInlineForm
                                    rooms={rooms}
                                    date={selectedDay}
                                    onSubmit={handleReserve}
                                    loading={createReservation.isPending}
                                />
                            )}

                            {/* Reservation list */}
                            {dayReservations.length === 0 && !showReserveForm ? (
                                <p className="text-[10px] text-slate-600 py-3 text-center">Sin reservas</p>
                            ) : (
                                <div className="space-y-1.5 mt-2">
                                    {dayReservations.map((r) => {
                                        const start = new Date(r.startTime);
                                        const end = new Date(r.endTime);
                                        const isOwner = r.userId === authStore.user?.id;
                                        return (
                                            <div
                                                key={r.id}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 group"
                                            >
                                                <div
                                                    className="w-0.5 h-8 rounded-full shrink-0"
                                                    style={{ backgroundColor: r.roomColor ?? "#818cf8" }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-medium text-slate-200 truncate">{r.title}</p>
                                                    <p className="text-[9px] text-slate-500">
                                                        {r.roomName} · {start.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} · {r.userName}
                                                    </p>
                                                </div>
                                                {(isOwner || isManager) && (
                                                    <button
                                                        onClick={() => handleCancelReservation(r.id)}
                                                        className="text-[10px] text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                                                        title="Cancelar"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Tasks section */}
                        {(() => {
                            const dayTasks = tasksByDate.get(selectedDay) ?? [];
                            return (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                                            📋 Tareas {dayTasks.length > 0 && `(${dayTasks.length})`}
                                        </span>
                                        <button
                                            onClick={() => setShowAddTask(!showAddTask)}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition"
                                        >
                                            {showAddTask ? "Cancelar" : "+ Tarea"}
                                        </button>
                                    </div>

                                    {showAddTask && (
                                        <QuickTaskForm
                                            projects={projects}
                                            onSubmit={handleQuickAddTask}
                                        />
                                    )}

                                    {dayTasks.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                            {dayTasks.map((t) => (
                                                <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[t.priority] ?? priorityColors.Medium}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-medium text-slate-200 truncate">{t.title}</p>
                                                        <p className="text-[9px] text-slate-500">{t.projectName}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {dayTasks.length === 0 && !showAddTask && (
                                        <p className="text-[10px] text-slate-600 py-2 text-center">Sin tareas</p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
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

/* ── Inline Reserve Form (inside side panel) ── */
const ReserveInlineForm = ({
    rooms,
    date,
    onSubmit,
    loading,
}: {
    rooms: { id: number; name: string; color: string | null }[];
    date: string;
    onSubmit: (dto: CreateReservationDto) => void;
    loading: boolean;
}) => {
    const [roomId, setRoomId] = useState(rooms[0]?.id ?? 0);
    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [notes, setNotes] = useState("");

    return (
        <div className="bg-slate-700/20 border border-slate-700/40 rounded-xl p-3 space-y-3">
            <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Sala</label>
                <select
                    value={roomId}
                    onChange={(e) => setRoomId(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Motivo *</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Reunión de equipo"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Desde</label>
                    <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Hasta</label>
                    <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {TIME_SLOTS.filter((t) => t > startTime).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Notas</label>
                <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Opcional..."
                />
            </div>

            <button
                onClick={() => onSubmit({
                    roomId,
                    title,
                    startTime: `${date}T${startTime}:00`,
                    endTime: `${date}T${endTime}:00`,
                    notes: notes || undefined,
                })}
                disabled={!title.trim() || !roomId || endTime <= startTime || loading}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Reservando..." : "Confirmar reserva"}
            </button>
        </div>
    );
};

/* ── Quick Task Form (inside side panel) ── */
const QuickTaskForm = ({
    projects,
    onSubmit,
}: {
    projects: Project[];
    onSubmit: (data: { projectId: number; title: string; priority: string }) => void;
}) => {
    const [projectId, setProjectId] = useState(projects[0]?.id ?? 0);
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState("Medium");

    return (
        <div className="bg-slate-700/20 border border-slate-700/40 rounded-xl p-3 space-y-3">
            <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Proyecto</label>
                <select
                    value={projectId}
                    onChange={(e) => setProjectId(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Título *</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nombre de la tarea"
                />
            </div>

            <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Prioridad</label>
                <div className="flex gap-1.5 mt-1">
                    {(["Low", "Medium", "High", "Urgent"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPriority(p)}
                            className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${priority === p
                                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                                    : "bg-slate-700/30 border-slate-700/50 text-slate-500 hover:text-slate-400"
                                }`}
                        >
                            {p === "Low" ? "Baja" : p === "Medium" ? "Media" : p === "High" ? "Alta" : "Urgente"}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => onSubmit({ projectId, title, priority })}
                disabled={!title.trim() || !projectId}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Crear tarea
            </button>
        </div>
    );
};

export default CalendarPage;
