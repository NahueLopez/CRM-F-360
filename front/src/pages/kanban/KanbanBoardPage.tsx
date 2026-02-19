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

const KanbanBoardPage: React.FC = () => {
    const { projectId: paramId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
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
            await loadBoard(); // Reload to get consistent sortOrders
        } catch (err) {
            console.error("Error moving task", err);
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
            } else {
                await taskService.create({
                    projectId,
                    columnId: newTaskColumnId,
                    ...data,
                });
            }
            setModalOpen(false);
            loadBoard();
        } catch (err) {
            console.error("Error saving task", err);
        }
    };

    const handleDeleteTask = async () => {
        if (!editingTask) return;
        if (!confirm("¿Eliminar esta tarea?")) return;
        try {
            await taskService.remove(editingTask.id);
            setModalOpen(false);
            loadBoard();
        } catch (err) {
            console.error("Error deleting task", err);
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
                            {project?.companyName} · {tasks.length} tareas
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
