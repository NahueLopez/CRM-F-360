import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Deal } from "../../types/deal";

const fmt = (v?: number, cur?: string) => {
    if (!v) return "—";
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: cur || "ARS", maximumFractionDigits: 0 }).format(v);
};

interface Props {
    deal: Deal;
    onEdit: (deal: Deal) => void;
}

const PipelineDealCard: React.FC<Props> = ({ deal, onEdit }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: deal.id,
        data: { type: "deal", deal },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onEdit(deal)}
            className={`bg-slate-800/70 border border-slate-700/40 rounded-lg p-3 
                         hover:border-indigo-500/30 transition cursor-grab active:cursor-grabbing
                         ${isDragging ? "opacity-40 ring-2 ring-indigo-500/50 shadow-lg scale-[1.02]" : ""}`}
        >
            <p className="text-sm font-medium truncate">{deal.title}</p>
            {deal.companyName && (
                <p className="text-[10px] text-slate-500 mt-0.5">🏢 {deal.companyName}</p>
            )}
            {deal.value != null && deal.value > 0 && (
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                    {fmt(deal.value, deal.currency)}
                </p>
            )}
            {deal.expectedCloseDate && (
                <p className="text-[10px] text-slate-600 mt-1">
                    📅 {new Date(deal.expectedCloseDate).toLocaleDateString("es-AR")}
                </p>
            )}
            <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-500">{deal.assignedToName}</span>
            </div>
        </div>
    );
};

export default PipelineDealCard;
