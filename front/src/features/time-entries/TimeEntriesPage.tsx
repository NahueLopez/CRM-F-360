import React, { useCallback, useEffect, useMemo, useState } from "react";
import { timeEntryService } from "./timeEntryService";
import { taskService } from "../tasks/taskService";
import { authStore } from "../../shared/auth/authStore";
import type { TimeEntry, ProjectHoursSummary } from "./types";
import type { Task } from "../tasks/types";
import { useToast } from "../../shared/context/ToastContext";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { TableSkeleton } from "../../shared/ui/Skeleton";

const TimeEntriesPage: React.FC = () => {
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectHoursSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectBreakdown, setShowProjectBreakdown] = useState(false);

  // Filters
  const [filterProject, setFilterProject] = useState<string>("");

  // Form state
  const [taskId, setTaskId] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<TimeEntry | null>(null);

  const userId = authStore.user?.id;
  const isLeader = authStore.hasAnyRole("Admin", "Manager");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const promises: Promise<unknown>[] = [
        timeEntryService.getAll(),
        taskService.getAll(),
      ];
      if (isLeader) {
        promises.push(timeEntryService.getProjectSummary());
      }
      const results = await Promise.all(promises);
      setEntries(results[0] as TimeEntry[]);
      setTasks(results[1] as Task[]);
      if (isLeader && results[2]) {
        setProjectSummary(results[2] as ProjectHoursSummary[]);
      }
    } catch (err) {
      console.error("Error loading entries", err);
    } finally {
      setLoading(false);
    }
  }, [userId, isLeader]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived data ──
  const projectNames = useMemo(() => {
    const names = new Set<string>();
    entries.forEach(e => names.add(e.projectName));
    return Array.from(names).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!filterProject) return entries;
    return entries.filter(e => e.projectName === filterProject);
  }, [entries, filterProject]);

  const filteredTasks = useMemo(() => {
    if (!filterProject) return tasks;
    return tasks.filter(t => t.projectName === filterProject);
  }, [tasks, filterProject]);

  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);

  // Project summary for selected project (if filtering)
  const selectedProjectSummary = useMemo(() => {
    if (!filterProject) return null;
    return projectSummary.find(p => p.projectName === filterProject) ?? null;
  }, [filterProject, projectSummary]);

  // ── Form handlers ──
  const resetForm = () => {
    setTaskId("");
    setDate(new Date().toISOString().slice(0, 10));
    setHours("");
    setDescription("");
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !hours || !userId) return;

    try {
      if (editing) {
        await timeEntryService.update(editing.id, {
          date,
          hours: Number(hours),
          description: description || undefined,
        });
        addToast("success", "Entrada actualizada");
      } else {
        await timeEntryService.create({
          taskId: Number(taskId),
          userId,
          date,
          hours: Number(hours),
          description: description || undefined,
        });
        addToast("success", `${hours} horas registradas`);
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Error saving entry", err);
      addToast("error", "Error al guardar");
    }
  };

  const startEdit = (entry: TimeEntry) => {
    setEditing(entry);
    setTaskId(entry.taskId);
    setDate(entry.date.slice(0, 10));
    setHours(String(entry.hours));
    setDescription(entry.description ?? "");
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Eliminar entrada",
      message: "Se eliminará esta entrada de horas. ¿Continuar?",
      confirmLabel: "Sí, eliminar",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await timeEntryService.remove(id);
      addToast("success", "Entrada eliminada");
      load();
    } catch (err) {
      console.error("Error deleting entry", err);
      addToast("error", "Error al eliminar");
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* ─── Header with filter ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Carga de horas</h2>
            <p className="text-sm text-slate-500 mt-0.5">Registrá las horas trabajadas por tarea</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white min-w-[200px]"
            >
              <option value="">Todos los proyectos</option>
              {projectNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {filterProject && (
              <button
                onClick={() => setFilterProject("")}
                className="text-xs text-slate-500 hover:text-slate-300 transition"
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        {/* ─── Summary cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Entradas</p>
            <p className="text-xl font-bold text-white mt-1">{filteredEntries.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Horas totales</p>
            <p className="text-xl font-bold text-indigo-400 mt-1">{totalHours.toFixed(1)} hs</p>
          </div>

          {/* When filtering by project: show estimated + progress */}
          {selectedProjectSummary && (
            <>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Estimado</p>
                <p className="text-xl font-bold text-slate-300 mt-1">
                  {selectedProjectSummary.estimatedHours > 0
                    ? `${selectedProjectSummary.estimatedHours} hs`
                    : "—"}
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Progreso</p>
                {selectedProjectSummary.estimatedHours > 0 ? (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${selectedProjectSummary.burnPercent > 100
                            ? "bg-red-500"
                            : selectedProjectSummary.burnPercent > 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            }`}
                          style={{ width: `${Math.min(selectedProjectSummary.burnPercent, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${selectedProjectSummary.burnPercent > 100 ? "text-red-400" : "text-emerald-400"
                        }`}>
                        {selectedProjectSummary.burnPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-slate-600 mt-1">—</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* ─── Project Breakdown (collapsible, only for leaders viewing all) ─── */}
        {!filterProject && isLeader && projectSummary.length > 0 && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowProjectBreakdown(p => !p)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition"
            >
              <span>📊 Resumen por proyecto ({projectSummary.length})</span>
              <span className={`text-xs text-slate-500 transition-transform ${showProjectBreakdown ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
            {showProjectBreakdown && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-slate-700/50 bg-slate-800/50">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Registradas</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Estimadas</th>
                    <th className="text-right px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Avance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {projectSummary.map(p => (
                    <tr
                      key={p.projectName}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                      onClick={() => { setFilterProject(p.projectName); setShowProjectBreakdown(false); }}
                    >
                      <td className="px-4 py-2.5 text-slate-200">{p.projectName}</td>
                      <td className="px-4 py-2.5 text-right text-indigo-400 font-medium tabular-nums">{p.loggedHours.toFixed(1)} hs</td>
                      <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">
                        {p.estimatedHours > 0 ? `${p.estimatedHours} hs` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {p.estimatedHours > 0 ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${p.burnPercent > 100 ? "bg-red-500" : p.burnPercent > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(p.burnPercent, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium tabular-nums ${p.burnPercent > 100 ? "text-red-400" : "text-slate-400"}`}>
                              {p.burnPercent.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-700/50 bg-slate-800/50">
                    <td className="px-4 py-2.5 text-xs font-semibold text-slate-400">Totales</td>
                    <td className="px-4 py-2.5 text-right text-indigo-400 font-bold tabular-nums text-xs">
                      {projectSummary.reduce((s, p) => s + p.loggedHours, 0).toFixed(1)} hs
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400 font-bold tabular-nums text-xs">
                      {projectSummary.reduce((s, p) => s + p.estimatedHours, 0).toFixed(0)} hs
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {/* ─── Log Hours Form ─── */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-200">
            {editing ? "Editar entrada" : "⏱ Cargar horas"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={taskId}
              onChange={(e) =>
                setTaskId(e.target.value ? Number(e.target.value) : "")
              }
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
            >
              <option value="">Seleccionar tarea</option>
              {filteredTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.projectName} — {t.title}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
            />

            <input
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Horas"
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
            />

            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opc)"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition"
            >
              {editing ? "Actualizar" : "Registrar"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* ─── Table ─── */}
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Proyecto</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tarea</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Horas</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Descripción</th>
                  {isLeader && <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>}
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="group transition-colors hover:bg-slate-800/60">
                    <td className="px-4 py-3 text-slate-400 tabular-nums">
                      {new Date(e.date).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{e.projectName}</td>
                    <td className="px-4 py-3 text-slate-200">{e.taskTitle}</td>
                    <td className="px-4 py-3 text-indigo-400 font-medium tabular-nums">
                      {e.hours} hs
                    </td>
                    <td className="px-4 py-3 text-slate-400">{e.description ?? "—"}</td>
                    {isLeader && (
                      <td className="px-4 py-3 text-slate-300 text-xs">{e.userName}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(e)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={isLeader ? 7 : 6}
                      className="p-6 text-center text-slate-500 italic"
                    >
                      {filterProject
                        ? `No hay horas registradas para "${filterProject}"`
                        : "No hay horas registradas."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmModal {...confirmProps} />
    </>
  );
};

export default TimeEntriesPage;
