import React, { useCallback, useEffect, useState } from "react";
import { timeEntryService } from "../../services/timeEntryService";
import { taskService } from "../../services/taskService";
import { authStore } from "../../auth/authStore";
import type { TimeEntry, ProjectHoursSummary } from "../../types/timeEntry";
import type { Task } from "../../types/task";

const TimeEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectHoursSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
      } else {
        await timeEntryService.create({
          taskId: Number(taskId),
          userId,
          date,
          hours: Number(hours),
          description: description || undefined,
        });
      }
      resetForm();
      load();
    } catch (err) {
      console.error("Error saving entry", err);
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
    if (!confirm("¿Eliminar esta entrada?")) return;
    try {
      await timeEntryService.remove(id);
      load();
    } catch (err) {
      console.error("Error deleting entry", err);
    }
  };

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  const statusLabels: Record<string, { text: string; color: string }> = {
    Planned: { text: "Planeado", color: "text-slate-400" },
    InProgress: { text: "En curso", color: "text-sky-400" },
    Paused: { text: "Pausado", color: "text-amber-400" },
    Done: { text: "Finalizado", color: "text-emerald-400" },
  };

  return (
    <div className="space-y-6">
      {/* ─── Project Hours Summary (Managers/Admins) ─── */}
      {isLeader && projectSummary.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/5 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            📊 Estimado vs Ejecutado por Proyecto
            <span className="text-[10px] text-slate-500 font-normal">(solo visible para Team Leaders y Admins)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="pb-2">Proyecto</th>
                  <th className="pb-2">Empresa</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 text-right">Estimado</th>
                  <th className="pb-2 text-right">Ejecutado</th>
                  <th className="pb-2 text-right">Diferencia</th>
                  <th className="pb-2 text-right">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {projectSummary.map((p) => {
                  const st = statusLabels[p.status] ?? statusLabels.Planned;
                  const overBudget = p.deltaHours > 0 && p.estimatedHours > 0;
                  const burnColor = p.burnPercent > 100
                    ? "bg-red-500"
                    : p.burnPercent > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                  return (
                    <tr key={p.projectId} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium">{p.projectName}</td>
                      <td className="py-2.5 text-slate-500 text-xs">{p.companyName}</td>
                      <td className="py-2.5">
                        <span className={`text-xs ${st.color}`}>{st.text}</span>
                      </td>
                      <td className="py-2.5 text-right text-slate-300">
                        {p.estimatedHours > 0 ? `${p.estimatedHours} hs` : "—"}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-indigo-400">
                        {p.loggedHours.toFixed(1)} hs
                      </td>
                      <td className={`py-2.5 text-right font-semibold ${overBudget ? "text-red-400" : p.estimatedHours > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                        {p.estimatedHours > 0 ? (
                          <>
                            {overBudget ? "+" : ""}{p.deltaHours.toFixed(1)} hs
                            {overBudget && <span className="ml-1 text-[10px]">⚠️</span>}
                          </>
                        ) : "—"}
                      </td>
                      <td className="py-2.5 text-right w-32">
                        {p.estimatedHours > 0 ? (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${burnColor}`} style={{ width: `${Math.min(p.burnPercent, 100)}%` }} />
                            </div>
                            <span className={`text-[10px] ${overBudget ? "text-red-400" : "text-slate-400"}`}>
                              {p.burnPercent.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">{p.totalEntries} registros</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Summary totals */}
          <div className="mt-4 pt-3 border-t border-indigo-500/10 flex gap-6 text-xs">
            <span className="text-slate-400">
              Total estimado: <strong className="text-slate-200">{projectSummary.reduce((s, p) => s + p.estimatedHours, 0).toFixed(0)} hs</strong>
            </span>
            <span className="text-slate-400">
              Total ejecutado: <strong className="text-indigo-400">{projectSummary.reduce((s, p) => s + p.loggedHours, 0).toFixed(1)} hs</strong>
            </span>
            {(() => {
              const totalEst = projectSummary.reduce((s, p) => s + p.estimatedHours, 0);
              const totalLog = projectSummary.reduce((s, p) => s + p.loggedHours, 0);
              const delta = totalLog - totalEst;
              return totalEst > 0 ? (
                <span className={delta > 0 ? "text-red-400" : "text-emerald-400"}>
                  Diferencia global: <strong>{delta > 0 ? "+" : ""}{delta.toFixed(1)} hs</strong>
                </span>
              ) : null;
            })()}
          </div>
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
            {tasks.map((t) => (
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

      {/* Summary */}
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-slate-400">
          {entries.length} entradas registradas
        </span>
        <span className="text-xs text-slate-600">·</span>
        <span className="text-sm font-semibold text-indigo-400">
          {totalHours.toFixed(2)} hs totales
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-slate-500">Cargando...</div>
      ) : (
        <table className="w-full bg-slate-900 border border-slate-800 rounded-lg text-sm">
          <thead>
            <tr className="bg-slate-800 text-left">
              <th className="p-3">Fecha</th>
              <th className="p-3">Proyecto</th>
              <th className="p-3">Tarea</th>
              <th className="p-3">Horas</th>
              <th className="p-3">Descripción</th>
              {isLeader && <th className="p-3">Usuario</th>}
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-slate-800">
                <td className="p-3 text-slate-400">
                  {new Date(e.date).toLocaleDateString("es-AR")}
                </td>
                <td className="p-3 text-slate-500 text-xs">{e.projectName}</td>
                <td className="p-3">{e.taskTitle}</td>
                <td className="p-3 text-indigo-400 font-medium">
                  {e.hours} hs
                </td>
                <td className="p-3 text-slate-400">{e.description ?? "—"}</td>
                {isLeader && (
                  <td className="p-3 text-slate-300 text-xs">{e.userName}</td>
                )}
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => startEdit(e)}
                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-xs transition"
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={isLeader ? 7 : 6}
                  className="p-3 text-center text-slate-500 italic"
                >
                  No hay horas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TimeEntriesPage;
