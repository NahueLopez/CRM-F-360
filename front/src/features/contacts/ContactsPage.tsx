import React, { useCallback, useEffect, useState } from "react";
import type { Contact } from "./types";
import type { Company } from "../companies/types";
import type { ActivityLog } from "../activities/types";
import { contactService } from "./contactService";
import { companyService } from "../companies/companyService";
import { activityService } from "../activities/activityService";
import { downloadCsvFromData } from "../../shared/utils/exportService";
import { useToast } from "../../shared/context/ToastContext";

const ACTIVITY_TYPES = [
    { value: "Call", label: "📞 Llamada", color: "text-sky-400" },
    { value: "Meeting", label: "🤝 Reunión", color: "text-violet-400" },
    { value: "Email", label: "📧 Email", color: "text-emerald-400" },
    { value: "Note", label: "📝 Nota", color: "text-amber-400" },
];

const ContactsPage: React.FC = () => {
    const { addToast } = useToast();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
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

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const [c, co] = await Promise.all([
                contactService.getAll(),
                companyService.getAll(),
            ]);
            setContacts(c);
            setCompanies(co);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const resetForm = () => {
        setForm({ companyId: 0, fullName: "", email: "", phone: "", position: "", notes: "" });
        setEditing(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.companyId) return;
        try {
            if (editing) {
                await contactService.update(editing.id, {
                    fullName: form.fullName,
                    email: form.email || undefined,
                    phone: form.phone || undefined,
                    position: form.position || undefined,
                    notes: form.notes || undefined,
                });
            } else {
                await contactService.create({
                    companyId: form.companyId,
                    fullName: form.fullName,
                    email: form.email || undefined,
                    phone: form.phone || undefined,
                    position: form.position || undefined,
                    notes: form.notes || undefined,
                });
            }
            resetForm();
            load();
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
        if (!confirm("¿Eliminar este contacto?")) return;
        await contactService.remove(id);
        if (selected?.id === id) setSelected(null);
        load();
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
        <div className="flex gap-6 h-full">
            {/* Left: List */}
            <div className={`flex-1 space-y-4 ${selected ? "max-w-[55%]" : ""}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold">Contactos</h3>
                        <p className="text-sm text-slate-400">
                            {filtered.length} contactos registrados
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
                            className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-slate-300 transition disabled:opacity-40"
                        >
                            📥 CSV
                        </button>
                        <button
                            onClick={() => { setShowForm(!showForm); setEditing(null); }}
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition"
                        >
                            + Nuevo contacto
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, email o cargo..."
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                    />
                    <select
                        value={filterCompany ?? ""}
                        onChange={(e) => setFilterCompany(e.target.value ? Number(e.target.value) : undefined)}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                    >
                        <option value="">Todas las empresas</option>
                        {companies.map((co) => (
                            <option key={co.id} value={co.id}>{co.name}</option>
                        ))}
                    </select>
                </div>

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-200">
                            {editing ? "Editar contacto" : "Nuevo contacto"}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                value={form.companyId || ""}
                                onChange={(e) => setForm({ ...form, companyId: Number(e.target.value) })}
                                required
                                disabled={!!editing}
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
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
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                            />
                            <input
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="Email"
                                type="email"
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                            />
                            <input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="Teléfono"
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                            />
                            <input
                                value={form.position}
                                onChange={(e) => setForm({ ...form, position: e.target.value })}
                                placeholder="Cargo / Rol"
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                            />
                            <input
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Notas"
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition">
                                {editing ? "Actualizar" : "Crear"}
                            </button>
                            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300 hover:bg-slate-700 transition">
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}

                {/* Contact Cards */}
                {loading ? (
                    <div className="text-sm text-slate-500">Cargando...</div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => openDetail(c)}
                                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition
                  ${selected?.id === c.id
                                        ? "bg-indigo-950/40 border-indigo-500/50"
                                        : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800"
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold shrink-0">
                                        {c.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{c.fullName}</p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {c.position ? `${c.position} · ` : ""}{c.companyName}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {c.email && (
                                        <span className="text-xs text-slate-500 hidden sm:inline">{c.email}</span>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs transition"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-xs transition"
                                    >
                                        Borrar
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-center text-slate-500 text-sm italic py-6">
                                No hay contactos registrados.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Detail Panel */}
            {selected && (
                <div className="w-[45%] shrink-0 bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-bold">
                                {selected.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{selected.fullName}</h3>
                                <p className="text-sm text-slate-400">
                                    {selected.position ? `${selected.position} · ` : ""}{selected.companyName}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-lg">✕</button>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {selected.email && (
                            <div>
                                <span className="text-slate-500 text-xs">Email</span>
                                <p className="text-indigo-400">{selected.email}</p>
                            </div>
                        )}
                        {selected.phone && (
                            <div>
                                <span className="text-slate-500 text-xs">Teléfono</span>
                                <p>{selected.phone}</p>
                            </div>
                        )}
                        {selected.notes && (
                            <div className="col-span-2">
                                <span className="text-slate-500 text-xs">Notas</span>
                                <p className="text-slate-300">{selected.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Activity Form */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="text-sm font-semibold mb-3">Registrar actividad</h4>
                        <div className="flex gap-2">
                            <select
                                value={actType}
                                onChange={(e) => setActType(e.target.value)}
                                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white"
                            >
                                {ACTIVITY_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <input
                                value={actDesc}
                                onChange={(e) => setActDesc(e.target.value)}
                                placeholder="Descripción..."
                                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500"
                                onKeyDown={(e) => e.key === "Enter" && addActivity()}
                            />
                            <button
                                onClick={addActivity}
                                disabled={!actDesc.trim()}
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition disabled:opacity-40"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="border-t border-slate-700 pt-4">
                        <h4 className="text-sm font-semibold mb-3">Historial de actividad</h4>
                        {activities.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Sin actividad registrada.</p>
                        ) : (
                            <div className="space-y-3">
                                {activities.map((a) => {
                                    const typeInfo = ACTIVITY_TYPES.find((t) => t.value === a.type) ?? ACTIVITY_TYPES[3];
                                    return (
                                        <div key={a.id} className="flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs shrink-0">
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
                                                <p className="text-sm text-slate-300 mt-0.5">{a.description}</p>
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
    );
};

export default ContactsPage;
