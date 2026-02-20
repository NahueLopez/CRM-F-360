import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Deal } from "../types";
import type { PipelineSummary } from "../types";
import PipelineDealCard from "./PipelineDealCard";

const fmt = (v?: number) => {
    if (!v) return "";
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);
};

interface StageInfo {
    value: string;
    label: string;
    color: string;
    bg: string;
}

interface Props {
    stage: StageInfo;
    deals: Deal[];
    summary?: PipelineSummary;
    onEditDeal: (deal: Deal) => void;
}

const PipelineStageColumn: React.FC<Props> = ({ stage, deals, summary, onEditDeal }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `stage-${stage.value}`,
        data: { type: "stage", stage: stage.value },
    });

    return (
        <div
            className={`${stage.bg} border rounded-xl flex flex-col transition-all duration-200
                ${isOver
                    ? "border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/10 scale-[1.01]"
                    : "border-slate-700/50"
                }`}
        >
            {/* Header */}
            <div className="p-3 border-b border-slate-700/30">
                <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold ${stage.color}`}>{stage.label}</h3>
                    <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded-full">
                        {deals.length}
                    </span>
                </div>
                {summary && summary.totalValue > 0 && (
                    <p className="text-[10px] text-slate-400 mt-1">{fmt(summary.totalValue)}</p>
                )}
            </div>

            {/* Cards */}
            <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
                <SortableContext
                    items={deals.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {deals.map(deal => (
                        <PipelineDealCard key={deal.id} deal={deal} onEdit={onEditDeal} />
                    ))}
                </SortableContext>

                {deals.length === 0 && (
                    <div className={`flex items-center justify-center h-16 text-[10px] italic rounded-lg 
                                     border border-dashed transition-colors
                                     ${isOver ? "border-indigo-500/40 text-indigo-400" : "border-slate-700/30 text-slate-600"}`}>
                        {isOver ? "Soltar acá" : "Arrastrá deals acá"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PipelineStageColumn;
