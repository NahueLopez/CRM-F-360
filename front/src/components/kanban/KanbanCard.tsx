import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types/task";

interface Props {
    task: Task;
    onEdit: (task: Task) => void;
}

const priorityStyles: Record<string, string> = {
    Urgent: "border-l-red-500 bg-red-500/5",
    High: "border-l-orange-400 bg-orange-400/5",
    Medium: "border-l-sky-400 bg-sky-400/5",
    Low: "border-l-slate-500 bg-slate-500/5",
};

const priorityBadge: Record<string, string> = {
    Urgent: "bg-red-500/20 text-red-300",
    High: "bg-orange-400/20 text-orange-300",
    Medium: "bg-sky-400/20 text-sky-300",
    Low: "bg-slate-500/20 text-slate-400",
};

const KanbanCard: React.FC<Props> = ({ task, onEdit }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onEdit(task)}
            className={`border-l-4 rounded-lg p-3 border border-slate-700/60
        cursor-grab active:cursor-grabbing
        hover:border-slate-600 transition-colors
        ${priorityStyles[task.priority] ?? priorityStyles.Medium}`}
        >
            <p className="text-sm font-medium text-slate-100 leading-snug mb-2">
                {task.title}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
                <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityBadge[task.priority] ?? priorityBadge.Medium
                        }`}
                >
                    {task.priority}
                </span>

                {task.assigneeName && (
                    <span className="text-[10px] text-slate-400 bg-slate-800 rounded px-1.5 py-0.5">
                        {task.assigneeName}
                    </span>
                )}

                {task.dueDate && (
                    <span className="text-[10px] text-slate-500 ml-auto">
                        {new Date(task.dueDate).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                        })}
                    </span>
                )}
            </div>
        </div>
    );
};

export default KanbanCard;
