import React, { useCallback, useEffect, useState } from "react";
import type { Company } from "./types";
import type { ActivityLog } from "../activities/types";
import { companyService } from "./companyService";
import { activityService } from "../activities/activityService";
import { downloadCsvFromData } from "../../shared/utils/exportService";
import { useToast } from "../../shared/context/ToastContext";
import CompanyForm from "./components/CompanyForm";
import EmptyState from "../../shared/ui/EmptyState";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { CardsSkeleton } from "../../shared/ui/Skeleton";

const ACTIVITY_ICONS: Record<string, string> = {
  Call: "📞", Meeting: "🤝", Email: "📧", Note: "📝",
};

const GRADIENTS = [
  "from-indigo-500/20 to-violet-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-sky-500/20 to-cyan-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-fuchsia-500/20 to-purple-500/20",
];
const COLORS = [
  "text-indigo-400 border-indigo-500/20",
  "text-emerald-400 border-emerald-500/20",
  "text-sky-400 border-sky-500/20",
  "text-amber-400 border-amber-500/20",
  "text-rose-400 border-rose-500/20",
  "text-fuchsia-400 border-fuchsia-500/20",
];

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Detail panel
  const [selected, setSelected] = useState<Company | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newActivity, setNewActivity] = useState({ type: "Note", description: "" });
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  const load = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (err) {
      console.error("No se pudo cargar empresas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadActivities = useCallback(async (companyId: number) => {
    try {
      const data = await activityService.getByCompany(companyId);
      setActivities(data);
    } catch { setActivities([]); }
  }, []);

  useEffect(() => {
    if (selected) loadActivities(selected.id);
  }, [selected, loadActivities]);

  const handleNewClick = () => { setEditing(null); setShowForm(true); };
  const handleCreate = async (data: Partial<Company>) => {
    const newCompany = await companyService.create(data);
    setCompanies(prev => [...prev, newCompany]);
    setShowForm(false);
    addToast("success", "Empresa creada correctamente");
  };
  const handleUpdate = async (data: Partial<Company>) => {
    if (!editing) return;
    const updated = await companyService.update(editing.id, data);
    setCompanies(prev => prev.map(c => c.id === editing.id ? updated : c));
    setEditing(null);
    setShowForm(false);
    addToast("success", "Empresa actualizada");
  };
  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Eliminar empresa",
      message: "Esta acción eliminará la empresa y todos sus datos asociados. ¿Continuar?",
      confirmLabel: "Sí, eliminar",
      variant: "danger",
    });
    if (!ok) return;
    await companyService.remove(id);
    setCompanies(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
    addToast("success", "Empresa eliminada");
  };
  const handleEditClick = (company: Company) => { setEditing(company); setShowForm(true); };
  const handleCancelForm = () => { setEditing(null); setShowForm(false); };

  const handleAddActivity = async () => {
    if (!newActivity.description.trim() || !selected) return;
    await activityService.create({
      companyId: selected.id,
      type: newActivity.type,
      description: newActivity.description,
    });
    setNewActivity({ type: "Note", description: "" });
    loadActivities(selected.id);
    addToast("success", "Actividad registrada");
  };

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q)
      || (c.cuit ?? "").toLowerCase().includes(q)
      || (c.email ?? "").toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex gap-6">
        {/* Left - main content */}
        <div className={`space-y-5 ${selected ? "flex-1 max-w-[55%]" : "w-full"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Empresas</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {filtered.length} {filtered.length === 1 ? "empresa registrada" : "empresas registradas"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  downloadCsvFromData(filtered, [
                    { key: "name", header: "Nombre" },
                    { key: "cuit", header: "CUIT" },
                    { key: "email", header: "Email" },
                    { key: "phone", header: "Teléfono" },
                    { key: "notes", header: "Notas" },
                  ], `empresas_${new Date().toISOString().slice(0, 10)}.csv`);
                  addToast("success", `${filtered.length} empresas exportadas`);
                }}
                disabled={filtered.length === 0}
                className="px-3 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 text-sm text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30"
              >
                📥 CSV
              </button>
              <button type="button" onClick={handleNewClick}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.97]">
                + Nueva empresa
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, CUIT o email..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>

          {showForm && (
            <div className="border border-slate-700/50 rounded-xl p-5 bg-slate-800/30 animate-page-in">
              <h4 className="text-sm font-semibold mb-4">{editing ? "✏️ Editar empresa" : "🏢 Nueva empresa"}</h4>
              <CompanyForm initial={editing ?? {}} onSubmit={editing ? handleUpdate : handleCreate} onCancel={handleCancelForm} />
            </div>
          )}

          {loading ? (
            <CardsSkeleton count={6} />
          ) : filtered.length === 0 ? (
            companies.length === 0 ? (
              <EmptyState
                icon="🏢"
                title="Sin empresas registradas"
                description="Creá tu primera empresa para empezar a gestionar clientes y proyectos."
                actionLabel="+ Nueva empresa"
                onAction={handleNewClick}
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Sin resultados"
                description="No se encontraron empresas con esos filtros."
              />
            )
          ) : (
            <div className="space-y-2">
              {filtered.map((c, i) => {
                const gradIdx = i % GRADIENTS.length;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                      ${selected?.id === c.id
                        ? "bg-indigo-950/30 border-indigo-500/40"
                        : "bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-700/60"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[gradIdx]} border ${COLORS[gradIdx].split(" ")[1]} flex items-center justify-center text-sm font-bold ${COLORS[gradIdx].split(" ")[0]} shrink-0`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-slate-200">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {c.cuit ? `${c.cuit} · ` : ""}{c.email ?? "Sin email"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.phone && (
                        <span className="text-xs text-slate-600 tabular-nums hidden lg:inline">{c.phone}</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditClick(c); }}
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
                );
              })}
            </div>
          )}
        </div>

        {/* Right - detail panel */}
        {selected && (
          <div className="w-[45%] shrink-0 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto animate-page-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-lg font-bold text-indigo-400">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selected.name}</h3>
                  {selected.active !== false && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Activa
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-all">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {selected.cuit && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-16">CUIT</span>
                  <span className="text-slate-300 tabular-nums">{selected.cuit}</span>
                </div>
              )}
              {selected.email && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-16">Email</span>
                  <span className="text-indigo-400">{selected.email}</span>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-2">
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

            <div className="border-t border-slate-700/40 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Registrar actividad</h4>

              {/* Activity type buttons */}
              <div className="flex gap-1 mb-2">
                {Object.entries(ACTIVITY_ICONS).map(([type, icon]) => (
                  <button key={type} onClick={() => setNewActivity(p => ({ ...p, type }))}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${newActivity.type === type
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/60 border border-transparent"
                      }`}>
                    {icon} {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newActivity.description}
                  onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleAddActivity()}
                  placeholder="Agregar nota..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/40 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors" />
                <button onClick={handleAddActivity} disabled={!newActivity.description.trim()}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium disabled:opacity-30 transition-all active:scale-95">
                  +
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
                  {activities.map(a => (
                    <div key={a.id} className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-xs shrink-0">
                        {ACTIVITY_ICONS[a.type] ?? "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300">{a.description}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {a.userName} · {new Date(a.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
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

export default CompaniesPage;
