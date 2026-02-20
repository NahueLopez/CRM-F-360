import React, { useCallback, useEffect, useState } from "react";
import type { Company } from "../../types/company";
import type { ActivityLog } from "../../types/activity";
import { companyService } from "../../services/companyService";
import { activityService } from "../../services/activityService";
import { downloadCsvFromData } from "../../services/exportService";
import { useToast } from "../../context/ToastContext";
import CompanyForm from "../../components/companies/CompanyForm";
import CompaniesTable from "../../components/companies/CompaniesTable";

const ACTIVITY_ICONS: Record<string, string> = {
  Call: "📞", Meeting: "🤝", Email: "📧", Note: "📝",
};

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detail panel
  const [selected, setSelected] = useState<Company | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newActivity, setNewActivity] = useState({ type: "Note", description: "" });
  const { addToast } = useToast();

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
  };
  const handleUpdate = async (data: Partial<Company>) => {
    if (!editing) return;
    const updated = await companyService.update(editing.id, data);
    setCompanies(prev => prev.map(c => c.id === editing.id ? updated : c));
    setEditing(null);
    setShowForm(false);
  };
  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que querés borrar esta empresa?")) return;
    await companyService.remove(id);
    setCompanies(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
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
  };

  return (
    <div className="flex gap-6">
      {/* Left - main content */}
      <div className={`space-y-6 ${selected ? "flex-1" : "w-full"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Empresas</h3>
            <p className="text-sm text-slate-400">Gestioná tus clientes/empresas para asociarles proyectos.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                downloadCsvFromData(companies, [
                  { key: "name", header: "Nombre" },
                  { key: "cuit", header: "CUIT" },
                  { key: "email", header: "Email" },
                  { key: "phone", header: "Teléfono" },
                  { key: "notes", header: "Notas" },
                ], `empresas_${new Date().toISOString().slice(0, 10)}.csv`);
                addToast("success", `${companies.length} empresas exportadas`);
              }}
              disabled={companies.length === 0}
              className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800/60 text-sm text-slate-300 transition disabled:opacity-40"
            >
              📥 Exportar CSV
            </button>
            <button type="button" onClick={handleNewClick}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition">
              + Nueva empresa
            </button>
          </div>
        </div>

        {showForm && (
          <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
            <h4 className="text-lg font-semibold mb-3">{editing ? "Editar empresa" : "Crear nueva empresa"}</h4>
            <CompanyForm initial={editing ?? {}} onSubmit={editing ? handleUpdate : handleCreate} onCancel={handleCancelForm} />
          </div>
        )}
        {loading && <div className="text-sm text-slate-400">Cargando empresas...</div>}
        <CompaniesTable
          data={companies}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onRowClick={(c: Company) => setSelected(c)}
        />
      </div>

      {/* Right - detail panel */}
      {selected && (
        <div className="w-96 shrink-0 bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{selected.name}</h3>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
          </div>

          <div className="space-y-1 text-sm">
            {selected.cuit && <p className="text-slate-400">CUIT: {selected.cuit}</p>}
            {selected.email && <p className="text-slate-400">Email: {selected.email}</p>}
            {selected.notes && <p className="text-slate-500 text-xs italic">{selected.notes}</p>}
          </div>

          <hr className="border-slate-700" />

          <h4 className="text-sm font-semibold">📋 Actividad</h4>

          {/* Add activity */}
          <div className="flex gap-1 mb-2">
            {Object.entries(ACTIVITY_ICONS).map(([type, icon]) => (
              <button key={type} onClick={() => setNewActivity(p => ({ ...p, type }))}
                className={`text-xs px-2 py-1 rounded ${newActivity.type === type ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"} transition`}>
                {icon} {type}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newActivity.description}
              onChange={e => setNewActivity(p => ({ ...p, description: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handleAddActivity()}
              placeholder="Agregar nota..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs placeholder:text-slate-500" />
            <button onClick={handleAddActivity} disabled={!newActivity.description.trim()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium disabled:opacity-40 transition">+</button>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Sin actividad registrada</p>
            ) : activities.map(a => (
              <div key={a.id} className="flex gap-3 items-start">
                <span className="text-sm mt-0.5">{ACTIVITY_ICONS[a.type] ?? "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300">{a.description}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {a.userName} · {new Date(a.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
