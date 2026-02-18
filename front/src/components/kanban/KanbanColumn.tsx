import React from "react";
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
}

const KanbanColumn: React.FC<Props> = ({ column, tasks, onEditTask }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${column.id}`,
        data: { column },
    });

    return (
        <div
            className={`flex flex-col w-72 min-w-[18rem] shrink-0 rounded-xl
        bg-slate-800/50 border transition-colors
        ${isOver ? "border-indigo-500/60 bg-indigo-500/5" : "border-slate-700/50"}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-200">{column.name}</h4>
                <span className="text-[10px] text-slate-500 font-medium bg-slate-700/60 px-1.5 py-0.5 rounded-full">
                    {tasks.length}
                </span>
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
