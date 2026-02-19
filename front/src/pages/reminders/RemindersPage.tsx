import React, { useCallback, useEffect, useState } from "react";
import { reminderService } from "../../services/reminderService";
import { companyService } from "../../services/companyService";
import { contactService } from "../../services/contactService";
import type { Reminder } from "../../types/reminder";
import type { Company } from "../../types/company";
import type { Contact } from "../../types/contact";

const RemindersPage: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [overdue, setOverdue] = useState<Reminder[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
    const [form, setForm] = useState({ title: "", description: "", dueDate: "", contactId: "", companyId: "" });

    const load = useCallback(async () => {
        const [all, od, comps, conts] = await Promise.all([
            reminderService.getMine(),
            reminderService.getOverdue(),
            companyService.getAll(),
            contactService.getAll(),
        ]);
        setReminders(all);
        setOverdue(od);
        setCompanies(comps);
        setContacts(conts);
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = reminders.filter(r => {
        if (filter === "pending") return !r.isCompleted;
        if (filter === "completed") return r.isCompleted;
        return true;
    });

    const handleCreate = async () => {
        if (!form.title.trim() || !form.dueDate) return;
        await reminderService.create({
            title: form.title, description: form.description || undefined,
            dueDate: form.dueDate,
            contactId: form.contactId ? Number(form.contactId) : undefined,
            companyId: form.companyId ? Number(form.companyId) : undefined,
        });
        setForm({ title: "", description: "", dueDate: "", contactId: "", companyId: "" });
        setShowCreate(false);
        load();
    };

    const handleToggle = async (id: number) => { await reminderService.toggleComplete(id); load(); };
    const handleDelete = async (id: number) => { await reminderService.remove(id); load(); };

    const isOverdue = (r: Reminder) => !r.isCompleted && new Date(r.dueDate) < new Date();
    const isDueToday = (r: Reminder) => {
        const d = new Date(r.dueDate);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    };

    return (
        <div className="space-y-6">
            {/* Overdue alert */}
            {overdue.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="text-sm font-semibold text-red-300">
                            {overdue.length} recordatorio{overdue.length > 1 ? "s" : ""} vencido{overdue.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-red-400/70">Revisá tus pendientes</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(["pending", "all", "completed"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                            {f === "pending" ? "Pendientes" : f === "all" ? "Todos" : "Completados"}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                    + Nuevo recordatorio
                </button>
            </div>

            {/* Reminders list */}
            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-4xl mb-2">🎉</p>
                        <p className="text-sm">No hay recordatorios {filter === "pending" ? "pendientes" : ""}</p>
                    </div>
                ) : filtered.map(r => (
                    <div key={r.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition ${r.isCompleted
                            ? "bg-slate-800/30 border-slate-700/30 opacity-60"
                            : isOverdue(r)
                                ? "bg-red-500/5 border-red-500/20"
                                : isDueToday(r)
                                    ? "bg-amber-500/5 border-amber-500/20"
                                    : "bg-slate-800/50 border-slate-700/50"
                            }`}>
                        <button onClick={() => handleToggle(r.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${r.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-500 hover:border-indigo-400"}`}>
                            {r.isCompleted && <span className="text-xs">✓</span>}
                        </button>

                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${r.isCompleted ? "line-through text-slate-500" : ""}`}>{r.title}</p>
                            {r.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.description}</p>}
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] ${isOverdue(r) ? "text-red-400" : isDueToday(r) ? "text-amber-400" : "text-slate-500"}`}>
                                    📅 {new Date(r.dueDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                                    {isDueToday(r) && " · Hoy"}
                                    {isOverdue(r) && " · Vencido"}
                                </span>
                                {r.contactName && <span className="text-[10px] text-slate-500">👤 {r.contactName}</span>}
                                {r.companyName && <span className="text-[10px] text-slate-500">🏢 {r.companyName}</span>}
                                {r.projectName && <span className="text-[10px] text-slate-500">📁 {r.projectName}</span>}
                            </div>
                        </div>

                        <button onClick={() => handleDelete(r.id)}
                            className="text-slate-600 hover:text-red-400 text-sm transition">✕</button>
                    </div>
                ))}
            </div>

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Nuevo recordatorio</h3>
                            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
                        </div>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="¿Qué tenés que recordar?" autoFocus
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm placeholder:text-slate-500" />
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Descripción (opcional)" rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm resize-none placeholder:text-slate-500" />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Fecha</label>
                                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Contacto (opc.)</label>
                                <select value={form.contactId} onChange={e => setForm({ ...form, contactId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm">
                                    <option value="">Ninguno</option>
                                    {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Empresa (opc.)</label>
                            <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm">
                                <option value="">Ninguna</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-slate-600 text-sm">Cancelar</button>
                            <button onClick={handleCreate} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition">Crear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemindersPage;
