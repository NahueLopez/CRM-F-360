import React, { useState, useRef, useEffect } from "react";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Task } from "../../types/task";
import type { BoardColumn as ColumnType } from "../../types/boardColumn";
import KanbanCard from "./KanbanCard";

interface Props {
    column: ColumnType;
    tasks: Task[];
    onEditTask: (task: Task) => void;
    onRenameColumn: (columnId: number, newName: string) => void;
    onDeleteColumn: (columnId: number) => void;
}

const KanbanColumn: React.FC<Props> = ({
    column,
    tasks,
    onEditTask,
    onRenameColumn,
    onDeleteColumn,
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: { column },
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(column.name);
    const [menuOpen, setMenuOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Close menu on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    const handleRename = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== column.name) {
            onRenameColumn(column.id, trimmed);
        } else {
            setEditName(column.name);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleRename();
        if (e.key === "Escape") {
            setEditName(column.name);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        setMenuOpen(false);
        if (tasks.length > 0) {
            if (!confirm(`La columna "${column.name}" tiene ${tasks.length} tarea(s). ¿Eliminar de todas formas?`)) {
                return;
            }
        } else {
            if (!confirm(`¿Eliminar la columna "${column.name}"?`)) return;
        }
        onDeleteColumn(column.id);
    };

    return (
        <div
            className={`flex flex-col w-72 min-w-[18rem] shrink-0 rounded-xl
        bg-slate-800/50 border transition-colors
        ${isOver ? "border-indigo-500/60 bg-indigo-500/5" : "border-slate-700/50"}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/50 group">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyDown}
                            className="text-sm font-semibold text-slate-200 bg-slate-700/80 
                                       border border-indigo-500/50 rounded px-1.5 py-0.5 
                                       outline-none w-full"
                            maxLength={50}
                        />
                    ) : (
                        <h4
                            className="text-sm font-semibold text-slate-200 cursor-pointer 
                                       hover:text-indigo-300 transition truncate"
                            onClick={() => {
                                setEditName(column.name);
                                setIsEditing(true);
                            }}
                            title="Click para renombrar"
                        >
                            {column.name}
                        </h4>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-700/60 px-1.5 py-0.5 rounded-full shrink-0">
                        {tasks.length}
                    </span>
                </div>

                {/* Context menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-slate-500 hover:text-slate-300 transition opacity-0 
                                   group-hover:opacity-100 p-1 rounded hover:bg-slate-700/60 text-sm"
                        title="Opciones"
                    >
                        ⋯
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 
                                        rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1">
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setEditName(column.name);
                                    setIsEditing(true);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm text-slate-300 
                                           hover:bg-slate-700/60 hover:text-white transition flex items-center gap-2"
                            >
                                <span>✏️</span> Renombrar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-3 py-1.5 text-sm text-red-400 
                                           hover:bg-red-500/10 hover:text-red-300 transition flex items-center gap-2"
                            >
                                <span>🗑️</span> Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cards */}
            <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px]">
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <KanbanCard key={task.id} task={task} onEdit={onEditTask} />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-slate-600 italic">
                        Arrastrá tareas acá
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
