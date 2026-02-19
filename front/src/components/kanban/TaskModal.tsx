import React, { useCallback, useEffect, useState } from "react";
import type { Task } from "../../types/task";
import type { User } from "../../types/user";
import type { TaskComment } from "../../types/taskComment";
import { taskCommentService } from "../../services/taskCommentService";

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

    // Comments
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        setTitle(initial?.title ?? "");
        setDescription(initial?.description ?? "");
        setPriority(initial?.priority ?? "Medium");
        setAssigneeId(initial?.assigneeId ?? undefined);
        setDueDate(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
    }, [initial]);

    const loadComments = useCallback(async () => {
        if (!initial?.id) return;
        setLoadingComments(true);
        try {
            const data = await taskCommentService.getByTask(initial.id);
            setComments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingComments(false);
        }
    }, [initial?.id]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !initial?.id) return;
        try {
            await taskCommentService.create(initial.id, newComment.trim());
            setNewComment("");
            loadComments();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!initial?.id) return;
        await taskCommentService.remove(initial.id, commentId);
        loadComments();
    };

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
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-0">
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

                <div className="overflow-y-auto flex-1 p-6 pt-4 space-y-4">
                    <form onSubmit={handleSubmit} id="task-form" className="space-y-4">
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
                    </form>

                    {/* Comments Section - only for editing */}
                    {initial && (
                        <div className="border-t border-slate-700 pt-4 mt-4">
                            <h4 className="text-sm font-semibold text-slate-200 mb-3">
                                💬 Comentarios ({comments.length})
                            </h4>

                            {/* Add comment */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Escribí un comentario..."
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition disabled:opacity-40"
                                >
                                    Enviar
                                </button>
                            </div>

                            {/* Comment list */}
                            {loadingComments ? (
                                <p className="text-xs text-slate-500">Cargando...</p>
                            ) : comments.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">
                                    No hay comentarios todavía.
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                    {comments.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex gap-3 items-start group"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {c.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs font-medium text-slate-200">
                                                        {c.userName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">
                                                        {new Date(c.createdAt).toLocaleString("es-AR", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-300 mt-0.5">
                                                    {c.content}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteComment(c.id)}
                                                className="text-slate-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between p-6 pt-3 border-t border-slate-700">
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
                            form="task-form"
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition"
                        >
                            {initial ? "Guardar" : "Crear"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
