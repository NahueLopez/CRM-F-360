import React, { useCallback, useEffect, useMemo, useState } from "react";
import { timeEntryService } from "./timeEntryService";
import { taskService } from "../tasks/taskService";
import { authStore } from "../../shared/auth/authStore";
import type { TimeEntry, ProjectHoursSummary } from "./types";
import type { Task } from "../tasks/types";
import { useToast } from "../../shared/context/ToastContext";

const TimeEntriesPage: React.FC = () => {
  const { addToast } = useToast();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectHoursSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!confirm("¿Eliminar esta entrada?")) return;
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
    <div className="space-y-6">
      {/* ─── Header with filter ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Carga de horas</h2>
          <p className="text-xs text-slate-500">Registrá las horas trabajadas por tarea</p>
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
        {!filterProject && isLeader && projectSummary.length > 0 && (
          <>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Proyectos</p>
              <p className="text-xl font-bold text-slate-300 mt-1">{projectSummary.length}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total estimado</p>
              <p className="text-xl font-bold text-slate-300 mt-1">
                {projectSummary.reduce((s, p) => s + p.estimatedHours, 0).toFixed(0)} hs
              </p>
            </div>
          </>
        )}
      </div>

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
        <div className="text-sm text-slate-500">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
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
              {filteredEntries.map((e) => (
                <tr key={e.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition">
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
                      className="px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-400 
                                 border border-indigo-500/20 hover:bg-indigo-600/30 text-xs transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 
                                 border border-red-500/20 hover:bg-red-500/20 text-xs transition"
                    >
                      🗑️ Borrar
                    </button>
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
  );
};

export default TimeEntriesPage;
