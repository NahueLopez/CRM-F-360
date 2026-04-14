import React, { useCallback, useEffect, useState } from "react";
import type { Company } from "./types";
import type { ActivityLog } from "../activities/types";
import type { Contact } from "../contacts/types";
import { activityService } from "../activities/activityService";
import { contactService } from "../contacts/contactService";
import { userService } from "../users/userService";
import { downloadCsvFromData } from "../../shared/utils/exportService";
import { useToast } from "../../shared/context/ToastContext";
import {
  useCompaniesPaged,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "../../shared/hooks/useCompanyQuery";
import CompanyForm from "./components/CompanyForm";
import EmptyState from "../../shared/ui/EmptyState";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { CardsSkeleton } from "../../shared/ui/Skeleton";
import Pagination from "../../shared/ui/Pagination";
import { usePagination } from "../../shared/hooks/usePagination";
import Modal from "../../shared/ui/Modal";
import { authStore } from "../../shared/auth/authStore";

const ACTIVITY_ICONS: Record<string, string> = {
  Call: "📞",
  Meeting: "🤝",
  Email: "📧",
  Note: "📝",
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

const FUNNEL_STAGES = [
  { value: "", label: "Todos los estados" },
  { value: "Contacto", label: "📞 Contacto", color: "bg-sky-500/15 text-sky-400 border-sky-500/20" },
  { value: "Interesado", label: "💡 Interesado", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" },
  { value: "Cierre", label: "🤝 Cierre", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  { value: "Implementación", label: "🚀 Implementación", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  { value: "Fidelización", label: "⭐ Fidelización", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  { value: "Perdido", label: "❌ Perdido", color: "bg-red-500/15 text-red-400 border-red-500/20" },
];

const getStatusColor = (status?: string) => {
  const stage = FUNNEL_STAGES.find(s => s.value === status);
  return stage?.color ?? "bg-slate-500/15 text-slate-400 border-slate-500/20";
};

const CompaniesPage: React.FC = () => {
  // ── React Query ──
  const { page, pageSize, search, handleSearch, setPage, setPageSize } = usePagination();

  // Status + agent + month filters (sent to server)
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");

  // Build params including CRM filters — sent to backend for server-side filtering
  const queryParams = {
    page,
    pageSize,
    search,
    status: statusFilter,
    commercialAgent: agentFilter,
    month: monthFilter,
  };

  const { data, isLoading: loading } = useCompaniesPaged(queryParams);
  const companies = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  // Fetch ALL companies (unfiltered) for status counters only
  const { data: allCompaniesData } = useCompaniesPaged({ page: 1, pageSize: 200 });
  const allCompanies = allCompaniesData?.items ?? [];

  // Load real system users for agent filter
  const [allUsers, setAllUsers] = useState<{fullName: string}[]>([]);
  useEffect(() => {
    userService.getAll().then(u => setAllUsers(u.filter((x: any) => x.active))).catch(() => {});
  }, []);

  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  // When filters change, reset to page 1
  const handleStatusFilter = (val: string) => { setStatusFilter(val); setPage(1); };
  const handleAgentFilter = (val: string) => { setAgentFilter(val); setPage(1); };
  const handleMonthFilter = (val: string) => { setMonthFilter(val); setPage(1); };
  const handleClearFilters = () => { setStatusFilter(""); setAgentFilter(""); setMonthFilter(""); setPage(1); };

  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Detail panel
  const [selected, setSelected] = useState<Company | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newActivity, setNewActivity] = useState({ type: "Note", description: "" });
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  // Contacts inside company panel
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ fullName: "", email: "", phone: "", position: "", notes: "" });
  const [savingContact, setSavingContact] = useState(false);

  const loadContacts = useCallback(async (companyId: number) => {
    try {
      const data = await contactService.getByCompany(companyId);
      setContacts(data);
    } catch {
      setContacts([]);
    }
  }, []);

  const loadActivities = useCallback(async (companyId: number) => {
    try {
      const data = await activityService.getByCompany(companyId);
      setActivities(data);
    } catch {
      setActivities([]);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      loadActivities(selected.id);
      loadContacts(selected.id);
    }
  }, [selected, loadActivities, loadContacts]);

  const handleCreateContact = async () => {
    if (!selected || !contactForm.fullName.trim()) return;
    setSavingContact(true);
    try {
      await contactService.create({ companyId: selected.id, ...contactForm });
      setContactForm({ fullName: "", email: "", phone: "", position: "", notes: "" });
      setShowContactForm(false);
      loadContacts(selected.id);
      addToast("success", "Contacto creado");
    } catch {
      addToast("error", "Error al crear contacto");
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    const ok = await confirm({ title: "Eliminar contacto", message: "¿Eliminar este contacto?", variant: "danger" });
    if (!ok) return;
    try {
      await contactService.remove(contactId);
      if (selected) loadContacts(selected.id);
      addToast("success", "Contacto eliminado");
    } catch {
      addToast("error", "Error al eliminar");
    }
  };

  const handleNewClick = () => {
    setEditing(null);
    setShowForm(true);
  };
  const handleCreate = async (data: Partial<Company>) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
    addToast("success", "Empresa creada correctamente");
  };
  const handleUpdate = async (data: Partial<Company>) => {
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing.id, data });
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
    await deleteMutation.mutateAsync(id);
    if (selected?.id === id) setSelected(null);
    addToast("success", "Empresa eliminada");
  };
  const handleEditClick = (company: Company) => {
    setEditing(company);
    setShowForm(true);
  };
  const handleCancelForm = () => {
    setEditing(null);
    setShowForm(false);
  };

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

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left - main content */}
        <div className={`space-y-5 ${selected ? "flex-1 lg:max-w-[55%]" : "w-full"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Empresas</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {statusFilter || monthFilter || agentFilter ? (
                  <>{companies.length} de {totalCount} empresas{statusFilter ? ` · ${statusFilter}` : ""}{agentFilter ? ` · ${agentFilter}` : ""}{monthFilter ? ` · ${new Date(monthFilter + "-01").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}` : ""}</>
                ) : (
                  <>{totalCount} {totalCount === 1 ? "empresa registrada" : "empresas registradas"}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {authStore.hasPermission("reports.export") && (
                <button
                  onClick={() => {
                    downloadCsvFromData(
                      companies,
                      [
                        { key: "commercialAgent", header: "Comercial" },
                        { key: "name", header: "Empresa" },
                        { key: "clientName", header: "Cliente" },
                        { key: "status", header: "Estado" },
                        { key: "website", header: "Web" },
                        { key: "socialMedia", header: "Redes" },
                        { key: "email", header: "Mail" },
                        { key: "phone", header: "Número" },
                        { key: "followUp", header: "Seguimiento" },
                        { key: "location", header: "Ubicación" },
                        { key: "cuit", header: "CUIT" },
                        { key: "industry", header: "Rubro" },
                        { key: "notes", header: "Notas" },
                      ],
                      `empresas_${new Date().toISOString().slice(0, 10)}.csv`,
                    );
                    addToast("success", `${companies.length} empresas exportadas`);
                  }}
                  disabled={companies.length === 0}
                  className="px-3 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 text-sm text-slate-400 hover:text-slate-200 transition-all disabled:opacity-30"
                >
                  📥 CSV
                </button>
              )}
              {authStore.hasPermission("companies.create") && (
                <button
                  type="button"
                  onClick={handleNewClick}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.97]"
                >
                  + Nueva empresa
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, cliente, comercial o email..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex flex-wrap gap-1.5 flex-1">
              {FUNNEL_STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => handleStatusFilter(stage.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border ${
                    statusFilter === stage.value
                      ? stage.value
                        ? stage.color
                        : "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                      : "bg-slate-800/40 text-slate-500 border-slate-700/30 hover:text-slate-300 hover:border-slate-600/50"
                  }`}
                >
                  {stage.value ? stage.label : "Todos"}
                  {stage.value && (() => {
                    const count = allCompanies.filter((c: Company) => c.status === stage.value).length;
                    return count > 0 ? ` (${count})` : "";
                  })()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={agentFilter}
                onChange={(e) => handleAgentFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-700/30 text-[11px] text-slate-400 focus:outline-none focus:border-indigo-500/40 transition"
              >
                <option value="">👤 Todos los comerciales</option>
                {allUsers.map((u) => (
                  <option key={u.fullName} value={u.fullName}>{u.fullName}</option>
                ))}
              </select>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => handleMonthFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/40 border border-slate-700/30 text-[11px] text-slate-400 focus:outline-none focus:border-indigo-500/40 transition"
              />
              {(statusFilter || agentFilter || monthFilter) && (
                <button
                  onClick={handleClearFilters}
                  className="text-[10px] text-red-400/70 hover:text-red-400 transition px-1.5 py-1 rounded-lg hover:bg-red-500/10"
                  title="Limpiar filtros"
                >
                  ✕ Limpiar
                </button>
              )}
            </div>
          </div>

          <Modal
            open={showForm}
            onClose={handleCancelForm}
            title={editing ? "✏️ Editar empresa" : "🏢 Nueva empresa"}
          >
            <CompanyForm
              initial={editing ?? {}}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={handleCancelForm}
            />
          </Modal>

          {loading ? (
            <CardsSkeleton count={6} />
          ) : companies.length === 0 ? (
            search.trim() === "" ? (
              <EmptyState
                icon="🏢"
                title="Sin empresas registradas"
                description="Creá tu primera empresa para empezar a gestionar clientes y proyectos."
                actionLabel={authStore.hasPermission("companies.create") ? "+ Nueva empresa" : undefined}
                onAction={authStore.hasPermission("companies.create") ? handleNewClick : undefined}
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
              {companies.map((c: Company, i: number) => {
                const gradIdx = i % GRADIENTS.length;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border cursor-pointer transition-all gap-2 sm:gap-0
                      ${selected?.id === c.id
                        ? "bg-indigo-950/30 border-indigo-500/40"
                        : "bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-700/60"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[gradIdx]} border ${COLORS[gradIdx].split(" ")[1]} flex items-center justify-center text-sm font-bold ${COLORS[gradIdx].split(" ")[0]} shrink-0`}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-slate-200">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {c.clientName ? `${c.clientName} · ` : ""}
                          {c.email ?? "Sin email"}
                        </p>
                      </div>
                      {c.status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border ${getStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {c.phone && (
                        <span className="text-xs text-slate-600 tabular-nums hidden lg:inline">
                          {c.phone}
                        </span>
                      )}
                      {authStore.hasPermission("companies.edit") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(c);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      {authStore.hasPermission("companies.delete") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c.id);
                          }}
                          className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Eliminar empresa"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {!loading && totalCount > 0 && (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  onChangePage={setPage}
                  onChangePageSize={setPageSize}
                />
              )}
            </div>
          )}
        </div>

        {/* Right - detail panel */}
        {selected && (
          <div className="w-full lg:w-[45%] shrink-0 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto animate-page-in">
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
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-all"
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              {selected.status && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Estado</span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${getStatusColor(selected.status)}`}>{selected.status}</span>
                </div>
              )}
              {selected.clientName && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Cliente</span>
                  <span className="text-slate-300">{selected.clientName}</span>
                </div>
              )}
              {selected.commercialAgent && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Comercial</span>
                  <span className="text-slate-300">{selected.commercialAgent}</span>
                </div>
              )}
              {selected.cuit && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">CUIT</span>
                  <span className="text-slate-300 tabular-nums">{selected.cuit}</span>
                </div>
              )}
              {selected.industry && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Rubro</span>
                  <span className="text-slate-300">{selected.industry}</span>
                </div>
              )}
              {selected.email && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Email</span>
                  <span className="text-indigo-400">{selected.email}</span>
                </div>
              )}
              {selected.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Teléfono</span>
                  <span className="text-slate-300 tabular-nums">{selected.phone}</span>
                </div>
              )}
              {selected.website && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Web</span>
                  <a href={selected.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate">{selected.website}</a>
                </div>
              )}
              {selected.socialMedia && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Redes</span>
                  <span className="text-slate-300 truncate">{selected.socialMedia}</span>
                </div>
              )}
              {selected.location && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">📍 Ubicación</span>
                  <span className="text-slate-300">{selected.location}</span>
                </div>
              )}
              {selected.createdAt && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs w-20">Fecha alta</span>
                  <span className="text-slate-400 text-xs tabular-nums">
                    {new Date(selected.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
              {selected.followUp && (
                <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300 leading-relaxed">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block mb-1">📋 Seguimiento</span>
                  {selected.followUp}
                </div>
              )}
              {selected.notes && (
                <div className="mt-2 p-3 rounded-lg bg-slate-800/50 text-xs text-slate-400 leading-relaxed">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">📝 Notas</span>
                  {selected.notes}
                </div>
              )}
            </div>

            {/* ── Contactos de la empresa ── */}
            <div className="border-t border-slate-700/40 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  👥 Contactos ({contacts.length})
                </h4>
                {authStore.hasPermission("contacts.create") && (
                  <button
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {showContactForm ? "✕ Cerrar" : "+ Agregar"}
                  </button>
                )}
              </div>

              {/* Inline contact form */}
              {showContactForm && (
                <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 mb-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={contactForm.fullName}
                      onChange={(e) => setContactForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="Nombre completo *"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    />
                    <input
                      value={contactForm.position}
                      onChange={(e) => setContactForm(p => ({ ...p, position: e.target.value }))}
                      placeholder="Cargo / Rol"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    />
                    <input
                      value={contactForm.email}
                      onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    />
                    <input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Teléfono"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    />
                  </div>
                  <input
                    value={contactForm.notes}
                    onChange={(e) => setContactForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notas"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/40 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => { setShowContactForm(false); setContactForm({ fullName: "", email: "", phone: "", position: "", notes: "" }); }}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateContact}
                      disabled={savingContact || !contactForm.fullName.trim()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition disabled:opacity-40"
                    >
                      {savingContact ? "Guardando..." : "Crear contacto"}
                    </button>
                  </div>
                </div>
              )}

              {/* Contacts list */}
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-3">Sin contactos registrados</p>
              ) : (
                <div className="space-y-1.5">
                  {contacts.map((ct) => (
                    <div key={ct.id} className="group flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/20 hover:border-slate-600/40 transition">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0">
                          {ct.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {ct.fullName}
                            {ct.position && <span className="text-slate-500 font-normal"> · {ct.position}</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {ct.email || ct.phone || "Sin datos de contacto"}
                          </p>
                        </div>
                      </div>
                      {authStore.hasPermission("contacts.delete") && (
                        <button
                          onClick={() => handleDeleteContact(ct.id)}
                          className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/60 hover:text-red-400 transition px-1.5 py-0.5 rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-700/40 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Registrar actividad
              </h4>

              {/* Activity type buttons */}
              <div className="flex gap-1 mb-2">
                {Object.entries(ACTIVITY_ICONS).map(([type, icon]) => (
                  <button
                    key={type}
                    onClick={() => setNewActivity((p) => ({ ...p, type }))}
                    className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${newActivity.type === type
                      ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                      : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/60 border border-transparent"
                      }`}
                  >
                    {icon} {type}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newActivity.description}
                  onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                  placeholder="Agregar nota..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700/40 text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                />
                <button
                  onClick={handleAddActivity}
                  disabled={!newActivity.description.trim()}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium disabled:opacity-30 transition-all active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-t border-slate-700/40 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Historial
              </h4>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-4">Sin actividad registrada</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-xs shrink-0">
                        {ACTIVITY_ICONS[a.type] ?? "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300">{a.description}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {a.userName} ·{" "}
                          {new Date(a.createdAt).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
