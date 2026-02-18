import React, { useEffect, useState } from "react";
import type { Task } from "../../types/task";
import type { User } from "../../types/user";

interface Props {
    initial?: Task | null;
    users: User[];
    onSubmit: (data: {
        title: string;
        description?: string;
        priority: string;
        assigneeId?: number;
        dueDate?: string;
    }) => void;
    onDelete?: () => void;
    onClose: () => void;
}

const PRIORITIES = [
    { value: "Low", label: "Baja", color: "text-slate-400" },
    { value: "Medium", label: "Media", color: "text-sky-400" },
    { value: "High", label: "Alta", color: "text-orange-400" },
    { value: "Urgent", label: "Urgente", color: "text-red-400" },
];

const TaskModal: React.FC<Props> = ({
    initial,
    users,
    onSubmit,
    onDelete,
    onClose,
}) => {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [priority, setPriority] = useState<string>(initial?.priority ?? "Medium");
    const [assigneeId, setAssigneeId] = useState<number | undefined>(
        initial?.assigneeId ?? undefined
    );
    const [dueDate, setDueDate] = useState(
        initial?.dueDate ? initial.dueDate.slice(0, 10) : ""
    );

    useEffect(() => {
        setTitle(initial?.title ?? "");
        setDescription(initial?.description ?? "");
        setPriority(initial?.priority ?? "Medium");
        setAssigneeId(initial?.assigneeId ?? undefined);
        setDueDate(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
    }, [initial]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            assigneeId,
            dueDate: dueDate || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <form
                onSubmit={handleSubmit}
                className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        {initial ? "Editar tarea" : "Nueva tarea"}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Title */}
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título de la tarea"
                    autoFocus
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Description */}
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción (opcional)"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Priority + Assignee */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">
                            Prioridad
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1">
                            Asignado
                        </label>
                        <select
                            value={assigneeId ?? ""}
                            onChange={(e) =>
                                setAssigneeId(
                                    e.target.value ? Number(e.target.value) : undefined
                                )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                        >
                            <option value="">Sin asignar</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Due date */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">
                        Fecha límite
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <div>
                        {initial && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="text-xs text-red-400 hover:text-red-300 transition"
                            >
                                Eliminar tarea
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:bg-slate-700 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition"
                        >
                            {initial ? "Guardar" : "Crear"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default TaskModal;
