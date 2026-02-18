import React, { useCallback, useEffect, useState } from "react";
import { timeEntryService } from "../../services/timeEntryService";
import { taskService } from "../../services/taskService";
import { authStore } from "../../auth/authStore";
import type { TimeEntry } from "../../types/timeEntry";
import type { Task } from "../../types/task";

const TimeEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [taskId, setTaskId] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<TimeEntry | null>(null);

  const userId = authStore.user?.id;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [allEntries, allTasks] = await Promise.all([
        userId ? timeEntryService.getByUser(userId) : timeEntryService.getAll(),
        taskService.getAll(),
      ]);
      setEntries(allEntries);
      setTasks(allTasks);
    } catch (err) {
      console.error("Error loading entries", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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

  return (
    <div className="space-y-6">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4"
      >
        <h3 className="text-sm font-semibold text-slate-200">
          {editing ? "Editar entrada" : "Cargar horas"}
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
              <th className="p-3">Tarea</th>
              <th className="p-3">Horas</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-slate-800">
                <td className="p-3 text-slate-400">
                  {new Date(e.date).toLocaleDateString("es-AR")}
                </td>
                <td className="p-3">{e.taskTitle}</td>
                <td className="p-3 text-indigo-400 font-medium">
                  {e.hours} hs
                </td>
                <td className="p-3 text-slate-400">{e.description ?? "—"}</td>
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
                  colSpan={5}
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
