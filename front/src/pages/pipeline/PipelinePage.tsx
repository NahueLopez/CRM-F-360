import React, { useCallback, useEffect, useState } from "react";
import { dealService } from "../../services/dealService";
import { companyService } from "../../services/companyService";
import type { Deal, DealStage, PipelineSummary } from "../../types/deal";
import type { Company } from "../../types/company";

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
    const [deals, setDeals] = useState<Deal[]>([]);
    const [summary, setSummary] = useState<PipelineSummary[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [editDeal, setEditDeal] = useState<Deal | null>(null);
    const [form, setForm] = useState({ title: "", companyId: "", value: "", notes: "", expectedCloseDate: "" });

    const load = useCallback(async () => {
        const [d, s, c] = await Promise.all([dealService.getAll(), dealService.getSummary(), companyService.getAll()]);
        setDeals(d);
        setSummary(s);
        setCompanies(c);
    }, []);

    useEffect(() => { load(); }, [load]);

    const dealsByStage = (stage: DealStage) => deals.filter(d => d.stage === stage);
    const stageTotal = (stage: string) => summary.find(s => s.stage === stage);

    const handleCreate = async () => {
        if (!form.title.trim()) return;
        await dealService.create({
            title: form.title,
            companyId: form.companyId ? Number(form.companyId) : undefined,
            value: form.value ? Number(form.value) : undefined,
            notes: form.notes || undefined,
            expectedCloseDate: form.expectedCloseDate || undefined,
        });
        setForm({ title: "", companyId: "", value: "", notes: "", expectedCloseDate: "" });
        setShowCreate(false);
        load();
    };

    const handleMove = async (deal: Deal, newStage: DealStage) => {
        await dealService.move(deal.id, newStage, 0);
        load();
    };

    const handleDelete = async (id: number) => {
        await dealService.remove(id);
        load();
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

            {/* Pipeline columns */}
            <div className="grid grid-cols-6 gap-3 min-h-[60vh]">
                {STAGES.map(stg => {
                    const stgDeals = dealsByStage(stg.value);
                    const info = stageTotal(stg.value);
                    return (
                        <div key={stg.value} className={`${stg.bg} border border-slate-700/50 rounded-xl flex flex-col`}>
                            <div className="p-3 border-b border-slate-700/30">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-xs font-bold ${stg.color}`}>{stg.label}</h3>
                                    <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded-full">{stgDeals.length}</span>
                                </div>
                                {info && info.totalValue > 0 && (
                                    <p className="text-[10px] text-slate-400 mt-1">{fmt(info.totalValue)}</p>
                                )}
                            </div>
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                {stgDeals.map(deal => (
                                    <div key={deal.id}
                                        className="bg-slate-800/70 border border-slate-700/40 rounded-lg p-3 group hover:border-indigo-500/30 transition cursor-pointer"
                                        onClick={() => setEditDeal(deal)}>
                                        <p className="text-sm font-medium truncate">{deal.title}</p>
                                        {deal.companyName && <p className="text-[10px] text-slate-500 mt-0.5">🏢 {deal.companyName}</p>}
                                        {deal.value != null && deal.value > 0 && (
                                            <p className="text-xs text-emerald-400 font-semibold mt-1">{fmt(deal.value, deal.currency)}</p>
                                        )}
                                        {deal.expectedCloseDate && (
                                            <p className="text-[10px] text-slate-600 mt-1">
                                                📅 {new Date(deal.expectedCloseDate).toLocaleDateString("es-AR")}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-slate-500">{deal.assignedToName}</span>
                                        </div>
                                        {/* Quick move buttons */}
                                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                                            {STAGES.filter(s => s.value !== deal.stage).slice(0, 3).map(s => (
                                                <button key={s.value} onClick={e => { e.stopPropagation(); handleMove(deal, s.value); }}
                                                    className={`text-[9px] px-1.5 py-0.5 rounded ${s.bg} ${s.color} hover:opacity-80`}>
                                                    → {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

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
                        <div className="flex flex-wrap gap-1">
                            {STAGES.filter(s => s.value !== editDeal.stage).map(s => (
                                <button key={s.value} onClick={() => { handleMove(editDeal, s.value); setEditDeal(null); }}
                                    className={`text-xs px-2 py-1 rounded ${s.bg} ${s.color} hover:opacity-80 transition`}>
                                    Mover a {s.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-700">
                            <button onClick={() => { handleDelete(editDeal.id); setEditDeal(null); }}
                                className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
                            <button onClick={() => setEditDeal(null)} className="px-4 py-2 rounded-lg border border-slate-600 text-sm">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PipelinePage;
