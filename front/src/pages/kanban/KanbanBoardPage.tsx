import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import type { Task } from "../../types/task";
import type { BoardColumn as ColumnType } from "../../types/boardColumn";
import type { User } from "../../types/user";
import { taskService } from "../../services/taskService";
import { boardColumnService } from "../../services/boardColumnService";
import { projectMemberService } from "../../services/projectMemberService";
import { projectService } from "../../services/projectService";
import KanbanColumn from "../../components/kanban/KanbanColumn";
import KanbanCard from "../../components/kanban/KanbanCard";
import TaskModal from "../../components/kanban/TaskModal";
import type { Project } from "../../types/project";
import { useToast } from "../../context/ToastContext";

const KanbanBoardPage: React.FC = () => {
    const { projectId: paramId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const projectId = Number(paramId);

    const [project, setProject] = useState<Project | null>(null);
    const [columns, setColumns] = useState<ColumnType[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [newTaskColumnId, setNewTaskColumnId] = useState<number | undefined>();

    // New column state
    const [addingColumn, setAddingColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState("");

    // Drag state
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // ── Load ──
    const loadBoard = useCallback(async () => {
        try {
            setLoading(true);
            const [proj, cols, boardTasks, members] = await Promise.all([
                projectService.getById(projectId),
                boardColumnService.getByProject(projectId),
                taskService.getByProject(projectId),
                projectMemberService.getByProject(projectId),
            ]);
            if (!proj) {
                navigate("/projects", { replace: true });
                return;
            }
            setProject(proj);
            setColumns(cols);
            setTasks(boardTasks);
            // Map members to User-like objects for the task modal
            setUsers(members.map(m => ({ id: m.userId, fullName: m.userName, email: m.userEmail, active: true })));
        } catch (err) {
            console.error("Error loading board", err);
        } finally {
            setLoading(false);
        }
    }, [projectId, navigate]);

    useEffect(() => {
        if (projectId) loadBoard();
    }, [projectId, loadBoard]);

    // ── Helpers ──
    const tasksByColumn = useMemo(() => {
        const map = new Map<number, Task[]>();
        for (const col of columns) {
            map.set(col.id, []);
        }
        for (const t of tasks) {
            const colId = t.columnId ?? columns[0]?.id;
            if (colId !== undefined) {
                const arr = map.get(colId);
                if (arr) arr.push(t);
            }
        }
        // Sort each column's tasks by sortOrder
        for (const arr of map.values()) {
            arr.sort((a, b) => a.sortOrder - b.sortOrder);
        }
        return map;
    }, [columns, tasks]);

    const findColumnByTaskId = (taskId: number): number | undefined => {
        for (const [colId, colTasks] of tasksByColumn) {
            if (colTasks.some((t) => t.id === taskId)) return colId;
        }
        return undefined;
    };

    // ── DnD ──
    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Determine target column
        let targetColumnId: number | undefined;

        if (typeof overId === "string" && overId.startsWith("column-")) {
            targetColumnId = Number(overId.replace("column-", ""));
        } else {
            targetColumnId = findColumnByTaskId(overId as number);
        }

        if (!targetColumnId) return;

        const currentColumnId = findColumnByTaskId(activeId);
        if (currentColumnId === targetColumnId) return;

        // Optimistic: move task to new column in local state
        setTasks((prev) =>
            prev.map((t) =>
                t.id === activeId ? { ...t, columnId: targetColumnId } : t
            )
        );
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as number;
        const overId = over.id;

        // Determine target column
        let targetColumnId: number | undefined;
        if (typeof overId === "string" && overId.startsWith("column-")) {
            targetColumnId = Number(overId.replace("column-", ""));
        } else {
            targetColumnId = findColumnByTaskId(overId as number);
        }

        if (!targetColumnId) return;

        // Get tasks in target column (excluding the dragged task)
        const colTasks = (tasksByColumn.get(targetColumnId) ?? [])
            .filter((t) => t.id !== taskId);

        let newSortOrder: number;

        if (typeof overId === "string" && overId.startsWith("column-")) {
            // Dropped on empty column area → put at end
            newSortOrder = colTasks.length;
        } else {
            // Dropped on a specific task → insert at that position
            const overIndex = colTasks.findIndex((t) => t.id === (overId as number));
            newSortOrder = overIndex >= 0 ? overIndex : colTasks.length;
        }

        try {
            await taskService.move(taskId, targetColumnId, newSortOrder);
            await loadBoard();
        } catch (err) {
            console.error("Error moving task", err);
            addToast("error", "Error al mover la tarea");
            loadBoard();
        }
    };

    // ── Task CRUD ──
    const openNewTask = (columnId: number) => {
        setEditingTask(null);
        setNewTaskColumnId(columnId);
        setModalOpen(true);
    };

    const openEditTask = (task: Task) => {
        setEditingTask(task);
        setNewTaskColumnId(undefined);
        setModalOpen(true);
    };

    const handleSubmitTask = async (data: {
        title: string;
        description?: string;
        priority: string;
        assigneeId?: number;
        dueDate?: string;
    }) => {
        try {
            if (editingTask) {
                await taskService.update(editingTask.id, {
                    ...data,
                    columnId: editingTask.columnId,
                });
                addToast("success", "Tarea actualizada");
            } else {
                await taskService.create({
                    projectId,
                    columnId: newTaskColumnId,
                    ...data,
                });
                addToast("success", `Tarea "${data.title}" creada`);
            }
            setModalOpen(false);
            loadBoard();
        } catch (err) {
            console.error("Error saving task", err);
            addToast("error", "Error al guardar la tarea");
        }
    };

    const handleDeleteTask = async () => {
        if (!editingTask) return;
        if (!confirm("¿Eliminar esta tarea?")) return;
        try {
            await taskService.remove(editingTask.id);
            addToast("success", "Tarea eliminada");
            setModalOpen(false);
            loadBoard();
        } catch (err) {
            console.error("Error deleting task", err);
            addToast("error", "Error al eliminar la tarea");
        }
    };

    // ── Column CRUD ──
    const handleAddColumn = async () => {
        const trimmed = newColumnName.trim();
        if (!trimmed) return;
        try {
            await boardColumnService.create(projectId, trimmed);
            addToast("success", `Columna "${trimmed}" creada`);
            setNewColumnName("");
            setAddingColumn(false);
            loadBoard();
        } catch (err) {
            console.error("Error creating column", err);
            addToast("error", "Error al crear la columna");
        }
    };

    const handleRenameColumn = async (columnId: number, newName: string) => {
        const col = columns.find(c => c.id === columnId);
        if (!col) return;
        try {
            await boardColumnService.update(projectId, columnId, newName, col.sortOrder);
            addToast("success", `Columna renombrada a "${newName}"`);
            loadBoard();
        } catch (err) {
            console.error("Error renaming column", err);
            addToast("error", "Error al renombrar");
        }
    };

    const handleDeleteColumn = async (columnId: number) => {
        try {
            await boardColumnService.remove(projectId, columnId);
            addToast("success", "Columna eliminada");
            loadBoard();
        } catch (err) {
            console.error("Error deleting column", err);
            addToast("error", "Error al eliminar la columna");
        }
    };

    // ── Render ──
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                Cargando tablero...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full -m-6">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/projects")}
                        className="text-slate-400 hover:text-slate-200 transition text-sm"
                    >
                        ← Proyectos
                    </button>
                    <div className="w-px h-5 bg-slate-700" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {project?.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {project?.companyName} · {tasks.length} tareas · {columns.length} columnas
                        </p>
                    </div>
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 h-full min-w-max">
                        {columns.map((col) => (
                            <div key={col.id} className="flex flex-col">
                                <KanbanColumn
                                    column={col}
                                    tasks={tasksByColumn.get(col.id) ?? []}
                                    onEditTask={openEditTask}
                                    onRenameColumn={handleRenameColumn}
                                    onDeleteColumn={handleDeleteColumn}
                                />

                                <button
                                    onClick={() => openNewTask(col.id)}
                                    className="mt-2 w-72 text-xs text-slate-500 hover:text-indigo-400
                    hover:bg-slate-800/60 border border-dashed border-slate-700
                    rounded-lg py-2 transition"
                                >
                                    + Agregar tarea
                                </button>
                            </div>
                        ))}

                        {/* Add new column */}
                        <div className="flex flex-col shrink-0">
                            {addingColumn ? (
                                <div className="w-72 min-w-[18rem] rounded-xl bg-slate-800/50 border border-indigo-500/40 p-3">
                                    <input
                                        autoFocus
                                        value={newColumnName}
                                        onChange={(e) => setNewColumnName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAddColumn();
                                            if (e.key === "Escape") {
                                                setAddingColumn(false);
                                                setNewColumnName("");
                                            }
                                        }}
                                        placeholder="Nombre de la columna..."
                                        className="w-full text-sm text-slate-200 bg-slate-700/80 
                                                   border border-slate-600 rounded px-2.5 py-1.5 
                                                   outline-none focus:border-indigo-500/60 
                                                   placeholder:text-slate-500"
                                        maxLength={50}
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={handleAddColumn}
                                            disabled={!newColumnName.trim()}
                                            className="flex-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 
                                                       disabled:bg-slate-700 disabled:text-slate-500
                                                       text-white rounded py-1.5 transition"
                                        >
                                            Crear columna
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAddingColumn(false);
                                                setNewColumnName("");
                                            }}
                                            className="text-xs text-slate-400 hover:text-slate-200 px-2 transition"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingColumn(true)}
                                    className="w-72 min-w-[18rem] rounded-xl bg-slate-800/30 
                                               border border-dashed border-slate-700/60 
                                               hover:border-indigo-500/40 hover:bg-slate-800/50 
                                               text-slate-500 hover:text-indigo-400
                                               flex items-center justify-center gap-2 py-8 
                                               transition cursor-pointer text-sm"
                                >
                                    <span className="text-lg">+</span> Nueva columna
                                </button>
                            )}
                        </div>
                    </div>

                    <DragOverlay>
                        {activeTask ? (
                            <div className="rotate-2 scale-105">
                                <KanbanCard task={activeTask} onEdit={() => { }} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Modal */}
            {modalOpen && (
                <TaskModal
                    initial={editingTask}
                    users={users}
                    onSubmit={handleSubmitTask}
                    onDelete={editingTask ? handleDeleteTask : undefined}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
};

export default KanbanBoardPage;
