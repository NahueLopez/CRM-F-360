import React, { useState } from "react";
import type { Contact } from "./types";
import type { ActivityLog } from "../activities/types";
import { contactService } from "./contactService";
import { activityService } from "../activities/activityService";
import { downloadCsvFromData } from "../../shared/utils/exportService";
import { useToast } from "../../shared/context/ToastContext";
import { contactSchema, validateForm } from "../../shared/schemas/formSchemas";
import { useContacts } from "../../shared/hooks/useContactQuery";
import { useCompanies } from "../../shared/hooks/useCompanyQuery";
import { useQueryClient } from "@tanstack/react-query";
import { contactKeys } from "../../shared/hooks/useContactQuery";
import EmptyState from "../../shared/ui/EmptyState";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { TableSkeleton } from "../../shared/ui/Skeleton";

const ACTIVITY_TYPES = [
    { value: "Call", label: "📞 Llamada", color: "text-sky-400", bg: "bg-sky-400/10" },
    { value: "Meeting", label: "🤝 Reunión", color: "text-violet-400", bg: "bg-violet-400/10" },
    { value: "Email", label: "📧 Email", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { value: "Note", label: "📝 Nota", color: "text-amber-400", bg: "bg-amber-400/10" },
];

const ContactsPage: React.FC = () => {
    const { addToast } = useToast();
    const { confirm, confirmProps } = useConfirm();
    const qc = useQueryClient();

    // ── React Query ──
    const { data: contacts = [], isLoading: loading } = useContacts();
    const { data: companies = [] } = useCompanies();

    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Contact | null>(null);
    const [search, setSearch] = useState("");
    const [filterCompany, setFilterCompany] = useState<number | "">();

    // Detail panel
    const [selected, setSelected] = useState<Contact | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [actType, setActType] = useState("Note");
    const [actDesc, setActDesc] = useState("");

    // Form fields
    const [form, setForm] = useState({
        companyId: 0,
        fullName: "",
        email: "",
        phone: "",
        position: "",
        notes: "",
    });

    const resetForm = () => {
        setForm({ companyId: 0, fullName: "", email: "", phone: "", position: "", notes: "" });
        setEditing(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validated = validateForm(contactSchema, form, (msg) => addToast("error", msg));
        if (!validated) return;
        try {
            if (editing) {
                await contactService.update(editing.id, {
                    fullName: validated.fullName,
                    email: validated.email || undefined,
                    phone: validated.phone || undefined,
                    position: validated.position || undefined,
                    notes: validated.notes || undefined,
                });
                addToast("success", "Contacto actualizado");
            } else {
                await contactService.create({
                    companyId: validated.companyId,
                    fullName: validated.fullName,
                    email: validated.email || undefined,
                    phone: validated.phone || undefined,
                    position: validated.position || undefined,
                    notes: validated.notes || undefined,
                });
                addToast("success", "Contacto creado");
            }
            resetForm();
            qc.invalidateQueries({ queryKey: contactKeys.all });
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (c: Contact) => {
        setEditing(c);
        setForm({
            companyId: c.companyId,
            fullName: c.fullName,
            email: c.email ?? "",
            phone: c.phone ?? "",
            position: c.position ?? "",
            notes: c.notes ?? "",
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        const ok = await confirm({
            title: "Eliminar contacto",
            message: "Se eliminará este contacto y toda su actividad asociada. ¿Continuar?",
            confirmLabel: "Sí, eliminar",
            variant: "danger",
        });
        if (!ok) return;
        await contactService.remove(id);
        if (selected?.id === id) setSelected(null);
        qc.invalidateQueries({ queryKey: contactKeys.all });
        addToast("success", "Contacto eliminado");
    };

    const openDetail = async (c: Contact) => {
        setSelected(c);
        const acts = await activityService.getByContact(c.id);
        setActivities(acts);
    };

    const addActivity = async () => {
        if (!selected || !actDesc.trim()) return;
        await activityService.create({
            contactId: selected.id,
            companyId: selected.companyId,
            type: actType,
            description: actDesc,
        });
        setActDesc("");
        const acts = await activityService.getByContact(selected.id);
        setActivities(acts);
        addToast("success", "Actividad registrada");
    };

    const filtered = contacts.filter((c) => {
        const matchSearch =
            c.fullName.toLowerCase().includes(search.toLowerCase()) ||
            (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (c.position ?? "").toLowerCase().includes(search.toLowerCase());
        const matchCompany = !filterCompany || c.companyId === filterCompany;
        return matchSearch && matchCompany;
    });

    return (
        <>
            <div className="flex gap-6 h-full">
                {/* Left: List */}
                <div className={`flex-1 space-y-5 ${selected ? "max-w-[55%]" : ""}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">Contactos</h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {filtered.length} {filtered.length === 1 ? "contacto" : "contactos"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    downloadCsvFromData(filtered, [
                                        { key: "fullName", header: "Nombre" },
                                        { key: "email", header: "Email" },
                                        { key: "phone", header: "Teléfono" },
                                        { key: "position", header: "Cargo" },
                                        { key: "companyName", header: "Empresa" },
                                        { key: "notes", header: "Notas" },
                                    ], `contactos_${new Date().toISOString().slice(0, 10)}.csv`);
                                    addToast("success", `${filtered.length} contactos exportados`);
                                }}
                                disabled={filtered.length === 0}
                                className="px-3 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 text-sm text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30"
                            >
                                📥 CSV
                            </button>
                            <button
                                onClick={() => { setShowForm(!showForm); setEditing(null); }}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.97]"
                            >
                                + Nuevo contacto
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, email o cargo..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                            />
                        </div>
                        <select
                            value={filterCompany ?? ""}
                            onChange={(e) => setFilterCompany(e.target.value ? Number(e.target.value) : undefined)}
                            className="px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300"
                        >
                            <option value="">Todas las empresas</option>
                            {companies.map((co) => (
                                <option key={co.id} value={co.id}>{co.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Form */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-4 animate-page-in">
                            <h4 className="text-sm font-semibold">
                                {editing ? "✏️ Editar contacto" : "👤 Nuevo contacto"}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={form.companyId || ""}
                                    onChange={(e) => setForm({ ...form, companyId: Number(e.target.value) })}
                                    required
                                    disabled={!!editing}
                                    className="px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-white"
                                >
                                    <option value="">Empresa *</option>
                                    {companies.map((co) => (
                                        <option key={co.id} value={co.id}>{co.name}</option>
                                    ))}
                                </select>
                                <input
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    placeholder="Nombre completo *"
                                    required
                                    className="px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-white placeholder:text-slate-600"
                                />
                                <input
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="Email"
                                    type="email"
                                    className="px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-white placeholder:text-slate-600"
                                />
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Teléfono"
                                    className="px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-white placeholder:text-slate-600"
                                />
                                <input
                                    value={form.position}
                                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                                    placeholder="Cargo / Rol"
                                    className="px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-white placeholder:text-slate-600"
                                />
                                <input
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Notas"
                                    className="px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 text-sm text-white placeholder:text-slate-600"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all active:scale-[0.97]">
                                    {editing ? "Actualizar" : "Crear"}
                                </button>
                                <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-slate-600/50 text-sm text-slate-400 hover:text-white hover:bg-slate-700/40 transition-all">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Contact Cards */}
                    {loading ? (
                        <TableSkeleton rows={6} cols={3} />
                    ) : filtered.length === 0 ? (
                        contacts.length === 0 ? (
                            <EmptyState
                                icon="👤"
                                title="Sin contactos"
                                description="Agregá tu primer contacto para empezar a registrar interacciones."
                                actionLabel="+ Nuevo contacto"
                                onAction={() => { setShowForm(true); setEditing(null); }}
                            />
                        ) : (
                            <EmptyState
                                icon="🔍"
                                title="Sin resultados"
                                description="No se encontraron contactos con esos filtros."
                            />
                        )
                    ) : (
                        <div className="space-y-2">
                            {filtered.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => openDetail(c)}
                                    className={`group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                    ${selected?.id === c.id
                                            ? "bg-indigo-950/30 border-indigo-500/40"
                                            : "bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-700/60"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0">
                                            {c.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate text-slate-200">{c.fullName}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {c.position ? `${c.position} · ` : ""}{c.companyName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Detail Panel */}
                {selected && (
                    <div className="w-[45%] shrink-0 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)] animate-page-in">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-400">
                                    {selected.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{selected.fullName}</h3>
                                    <p className="text-sm text-slate-500">
                                        {selected.position ? `${selected.position} · ` : ""}{selected.companyName}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-all">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Info */}
                        <div className="space-y-2 text-sm">
                            {selected.email && (
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-600 text-xs w-16">Email</span>
                                    <span className="text-indigo-400">{selected.email}</span>
                                </div>
                            )}
                            {selected.phone && (
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-600 text-xs w-16">Teléfono</span>
                                    <span className="text-slate-300 tabular-nums">{selected.phone}</span>
                                </div>
                            )}
                            {selected.notes && (
                                <div className="mt-2 p-3 rounded-lg bg-slate-800/50 text-xs text-slate-400 leading-relaxed">
                                    {selected.notes}
                                </div>
                            )}
                        </div>

                        {/* Activity Form */}
                        <div className="border-t border-slate-700/40 pt-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Registrar actividad</h4>
                            <div className="flex gap-2 mb-3">
                                {ACTIVITY_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setActType(t.value)}
                                        className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${actType === t.value
                                            ? `${t.bg} ${t.color} border border-current/20`
                                            : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/60 border border-transparent"
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={actDesc}
                                    onChange={(e) => setActDesc(e.target.value)}
                                    placeholder="Descripción..."
                                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/40 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                                    onKeyDown={(e) => e.key === "Enter" && addActivity()}
                                />
                                <button
                                    onClick={addActivity}
                                    disabled={!actDesc.trim()}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium transition-all disabled:opacity-30 active:scale-95"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="border-t border-slate-700/40 pt-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Historial</h4>
                            {activities.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center py-4">Sin actividad registrada</p>
                            ) : (
                                <div className="space-y-3">
                                    {activities.map((a) => {
                                        const typeInfo = ACTIVITY_TYPES.find((t) => t.value === a.type) ?? ACTIVITY_TYPES[3];
                                        return (
                                            <div key={a.id} className="flex gap-3 items-start">
                                                <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-xs shrink-0">
                                                    {typeInfo.label.split(" ")[0]}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={`text-xs font-medium ${typeInfo.color}`}>
                                                            {typeInfo.label.split(" ").slice(1).join(" ")}
                                                        </span>
                                                        <span className="text-[10px] text-slate-600">
                                                            {new Date(a.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 mt-0.5">{a.description}</p>
                                                    <p className="text-[10px] text-slate-600">por {a.userName}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <ConfirmModal {...confirmProps} />
        </>
    );
};

export default ContactsPage;
