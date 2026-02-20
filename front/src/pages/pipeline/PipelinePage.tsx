import React, { useCallback, useEffect, useState } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { dealService } from "../../services/dealService";
import { companyService } from "../../services/companyService";
import type { Deal, DealStage, PipelineSummary } from "../../types/deal";
import type { Company } from "../../types/company";
import PipelineStageColumn from "../../components/pipeline/PipelineStageColumn";
import PipelineDealCard from "../../components/pipeline/PipelineDealCard";
import { useToast } from "../../context/ToastContext";

const STAGES: { value: DealStage; label: string; color: string; bg: string }[] = [
    { value: "Lead", label: "Lead", color: "text-slate-300", bg: "bg-slate-700/50" },
    { value: "Contacted", label: "Contactado", color: "text-sky-300", bg: "bg-sky-900/30" },
    { value: "Proposal", label: "Propuesta", color: "text-violet-300", bg: "bg-violet-900/30" },
    { value: "Negotiation", label: "Negociación", color: "text-amber-300", bg: "bg-amber-900/30" },
    { value: "ClosedWon", label: "Ganado ✅", color: "text-emerald-300", bg: "bg-emerald-900/30" },
    { value: "ClosedLost", label: "Perdido ❌", color: "text-red-300", bg: "bg-red-900/30" },
];

const fmt = (v?: number, cur?: string) => {
    if (!v) return "—";
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: cur || "ARS", maximumFractionDigits: 0 }).format(v);
};

const PipelinePage: React.FC = () => {
    const { addToast } = useToast();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [summary, setSummary] = useState<PipelineSummary[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [editDeal, setEditDeal] = useState<Deal | null>(null);
    const [form, setForm] = useState({ title: "", companyId: "", value: "", notes: "", expectedCloseDate: "" });

    // Drag state
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const load = useCallback(async () => {
        const [d, s, c] = await Promise.all([dealService.getAll(), dealService.getSummary(), companyService.getAll()]);
        setDeals(d);
        setSummary(s);
        setCompanies(c);
    }, []);

    useEffect(() => { load(); }, [load]);

    const dealsByStage = (stage: DealStage) => deals.filter(d => d.stage === stage);
    const stageTotal = (stage: string) => summary.find(s => s.stage === stage);

    // ── Drag & Drop ──
    const handleDragStart = (event: DragStartEvent) => {
        const deal = deals.find(d => d.id === event.active.id);
        setActiveDeal(deal ?? null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Determine target stage
        let targetStage: DealStage | undefined;

        if (typeof overId === "string" && overId.startsWith("stage-")) {
            targetStage = overId.replace("stage-", "") as DealStage;
        } else {
            // Dropped on another deal card — find its stage
            const overDeal = deals.find(d => d.id === overId);
            targetStage = overDeal?.stage;
        }

        if (!targetStage) return;

        const activeDeal = deals.find(d => d.id === activeId);
        if (!activeDeal || activeDeal.stage === targetStage) return;

        // Optimistic: move deal to new stage in local state
        setDeals(prev =>
            prev.map(d =>
                d.id === activeId ? { ...d, stage: targetStage! } : d
            )
        );
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveDeal(null);
        const { active, over } = event;
        if (!over) return;

        const dealId = active.id as number;
        const overId = over.id;

        // Determine target stage
        let targetStage: DealStage | undefined;
        if (typeof overId === "string" && overId.startsWith("stage-")) {
            targetStage = overId.replace("stage-", "") as DealStage;
        } else {
            const overDeal = deals.find(d => d.id === overId);
            targetStage = overDeal?.stage;
        }

        if (!targetStage) return;

        const deal = deals.find(d => d.id === dealId);
        if (!deal) return;

        // Only call API if stage actually changed from original
        try {
            const stageName = STAGES.find(s => s.value === targetStage)?.label ?? targetStage;
            await dealService.move(dealId, targetStage, 0);
            addToast("success", `Deal movido a ${stageName}`);
            await load();
        } catch (err) {
            console.error("Error moving deal", err);
            addToast("error", "Error al mover el deal");
            load();
        }
    };

    const handleDragCancel = () => {
        setActiveDeal(null);
        load(); // Revert any optimistic changes
    };

    // ── CRUD ──
    const handleCreate = async () => {
        if (!form.title.trim()) return;
        try {
            await dealService.create({
                title: form.title,
                companyId: form.companyId ? Number(form.companyId) : undefined,
                value: form.value ? Number(form.value) : undefined,
                notes: form.notes || undefined,
                expectedCloseDate: form.expectedCloseDate || undefined,
            });
            addToast("success", `Oportunidad "${form.title}" creada`);
            setForm({ title: "", companyId: "", value: "", notes: "", expectedCloseDate: "" });
            setShowCreate(false);
            load();
        } catch {
            addToast("error", "Error al crear la oportunidad");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await dealService.remove(id);
            addToast("success", "Oportunidad eliminada");
            load();
        } catch {
            addToast("error", "Error al eliminar");
        }
    };

    const totalPipeline = deals.filter(d => d.stage !== "ClosedLost").reduce((s, d) => s + (d.value ?? 0), 0);
    const wonTotal = deals.filter(d => d.stage === "ClosedWon").reduce((s, d) => s + (d.value ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Total Pipeline</p>
                    <p className="text-2xl font-bold text-indigo-300">{fmt(totalPipeline)}</p>
                    <p className="text-[10px] text-slate-500">{deals.length} oportunidades</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs text-slate-400">Ganados</p>
                    <p className="text-2xl font-bold text-emerald-300">{fmt(wonTotal)}</p>
                    <p className="text-[10px] text-slate-500">{deals.filter(d => d.stage === "ClosedWon").length} deals cerrados</p>
                </div>
                <div className="flex items-center justify-end">
                    <button onClick={() => setShowCreate(true)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                        + Nueva oportunidad
                    </button>
                </div>
            </div>

            {/* Pipeline columns with DnD */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="grid grid-cols-6 gap-3 min-h-[60vh]">
                    {STAGES.map(stg => (
                        <PipelineStageColumn
                            key={stg.value}
                            stage={stg}
                            deals={dealsByStage(stg.value)}
                            summary={stageTotal(stg.value)}
                            onEditDeal={setEditDeal}
                        />
                    ))}
                </div>

                {/* Drag overlay — floating card while dragging */}
                <DragOverlay>
                    {activeDeal ? (
                        <div className="rotate-1 scale-105 opacity-90">
                            <PipelineDealCard deal={activeDeal} onEdit={() => { }} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Nueva oportunidad</h3>
                            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
                        </div>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="Nombre de la oportunidad"
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm placeholder:text-slate-500" />
                        <div className="grid grid-cols-2 gap-3">
                            <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm">
                                <option value="">Empresa (opc.)</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                                placeholder="Valor $" className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                        </div>
                        <input type="date" value={form.expectedCloseDate} onChange={e => setForm({ ...form, expectedCloseDate: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Notas..." rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm resize-none placeholder:text-slate-500" />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-slate-600 text-sm">Cancelar</button>
                            <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition">Crear</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail/Edit modal */}
            {editDeal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{editDeal.title}</h3>
                            <button onClick={() => setEditDeal(null)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
                        </div>
                        <div className="space-y-2 text-sm">
                            {editDeal.companyName && <p><span className="text-slate-400">Empresa:</span> {editDeal.companyName}</p>}
                            {editDeal.contactName && <p><span className="text-slate-400">Contacto:</span> {editDeal.contactName}</p>}
                            <p><span className="text-slate-400">Etapa:</span> {STAGES.find(s => s.value === editDeal.stage)?.label}</p>
                            <p><span className="text-slate-400">Valor:</span> {fmt(editDeal.value, editDeal.currency)}</p>
                            <p><span className="text-slate-400">Asignado a:</span> {editDeal.assignedToName}</p>
                            {editDeal.expectedCloseDate && <p><span className="text-slate-400">Cierre esperado:</span> {new Date(editDeal.expectedCloseDate).toLocaleDateString("es-AR")}</p>}
                            {editDeal.notes && <p className="text-slate-400 text-xs mt-2">{editDeal.notes}</p>}
                        </div>

                        <div className="flex justify-between pt-3 border-t border-slate-700">
                            <button onClick={() => { if (confirm("¿Eliminar esta oportunidad?")) { handleDelete(editDeal.id); setEditDeal(null); } }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                           bg-red-500/10 text-red-400 border border-red-500/20
                                           hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40
                                           transition-all duration-200">
                                🗑️ Eliminar
                            </button>
                            <button onClick={() => setEditDeal(null)} className="px-4 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-700/50 text-sm transition">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PipelinePage;
