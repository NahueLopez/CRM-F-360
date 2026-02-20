import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project, ProjectStatus } from "./types";
import type { Company } from "../companies/types";
import type { User } from "../users/types";
import { projectService } from "./projectService";
import { companyService } from "../companies/companyService";
import { userService } from "../users/userService";
import { projectMemberService } from "./projectMemberService";
import { authStore } from "../../shared/auth/authStore";
import { useToast } from "../../shared/context/ToastContext";
import ProjectForm from "./components/ProjectForm";
import ProjectTeamModal from "./components/ProjectTeamModal";
import EmptyState from "../../shared/ui/EmptyState";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { CardsSkeleton } from "../../shared/ui/Skeleton";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  InProgress: { label: "En curso", dot: "bg-sky-400", bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
  Planned: { label: "Planificado", dot: "bg-amber-400", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  Paused: { label: "Pausado", dot: "bg-slate-400", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  Done: { label: "Finalizado", dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamProjectId, setTeamProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "">("");
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  const canManage = authStore.hasAnyRole("Admin", "Manager");

  const load = async () => {
    try {
      setLoading(true);
      const promises: [Promise<Company[]>, Promise<Project[]>, Promise<User[]>] = [
        canManage ? companyService.getAll() : Promise.resolve([]),
        projectService.getAll(),
        canManage ? userService.getAll() : Promise.resolve([]),
      ];
      const [companiesData, projectsData, usersData] = await Promise.all(promises);
      setCompanies(companiesData);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error cargando proyectos/empresas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleNewClick = () => { setEditing(null); setShowForm(true); };

  const handleCreate = async (data: Partial<Project>, memberIds?: number[]) => {
    const newProject = await projectService.create(data);
    if (memberIds && memberIds.length > 0) {
      await Promise.all(memberIds.map((userId) => projectMemberService.add(newProject.id, userId)));
    }
    setProjects((prev) => [...prev, newProject]);
    setShowForm(false);
    addToast("success", "Proyecto creado correctamente");
  };

  const handleUpdate = async (data: Partial<Project>) => {
    if (!editing) return;
    const updated = await projectService.update(editing.id, data);
    setProjects((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
    setEditing(null);
    setShowForm(false);
    addToast("success", "Proyecto actualizado");
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Eliminar proyecto",
      message: "Se eliminará el proyecto y todas sus tareas. Esta acción no se puede deshacer.",
      confirmLabel: "Sí, eliminar",
      variant: "danger",
    });
    if (!ok) return;
    await projectService.remove(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    addToast("success", "Proyecto eliminado");
  };

  const handleEditClick = (project: Project) => { setEditing(project); setShowForm(true); };
  const handleCancelForm = () => { setEditing(null); setShowForm(false); };

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      || (p.companyName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const formatDate = (d?: string) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Proyectos</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {canManage
                ? `${filtered.length} ${filtered.length === 1 ? "proyecto" : "proyectos"}`
                : "Tus proyectos asignados"}
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleNewClick}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.97]"
              disabled={companies.length === 0}
            >
              + Nuevo proyecto
            </button>
          )}
        </div>

        {canManage && companies.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <span>⚠️</span>
            Para crear proyectos primero necesitás cargar al menos una empresa.
          </div>
        )}

        {/* Search & Status Filter */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o empresa..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterStatus("")}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${!filterStatus
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
            >
              Todos
            </button>
            {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${filterStatus === s
                  ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} border ${STATUS_CONFIG[s].border}`
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Form panel */}
        {showForm && canManage && (
          <div className="border border-slate-700/50 rounded-xl p-5 bg-slate-800/30 animate-page-in">
            <h4 className="text-sm font-semibold mb-4">
              {editing ? "✏️ Editar proyecto" : "📁 Nuevo proyecto"}
            </h4>
            <ProjectForm
              initial={editing ?? {}}
              companies={companies}
              users={users}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {/* Project Cards */}
        {loading ? (
          <CardsSkeleton count={6} />
        ) : filtered.length === 0 ? (
          projects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="Sin proyectos"
              description="Creá tu primer proyecto para empezar a organizar las tareas de tu equipo."
              actionLabel={canManage ? "+ Nuevo proyecto" : undefined}
              onAction={canManage ? handleNewClick : undefined}
            />
          ) : (
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              description="No se encontraron proyectos con esos filtros."
            />
          )
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.Planned;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}/board`)}
                  className="group flex items-center justify-between p-4 rounded-xl border bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-700/60 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Status dot */}
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-slate-200">{p.name}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border} shrink-0`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {p.companyName}
                        {p.taskCount > 0 && ` · ${p.taskCount} tareas`}
                        {p.startDate && ` · ${formatDate(p.startDate)}`}
                        {p.endDateEstimated && ` → ${formatDate(p.endDateEstimated)}`}
                      </p>
                    </div>
                  </div>

                  {/* Meta + Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {p.estimatedHours && (
                      <span className="text-xs text-slate-600 tabular-nums hidden lg:inline">
                        {p.estimatedHours}h est.
                      </span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/projects/${p.id}/board`); }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                      >
                        📋 Tablero
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setTeamProjectId(p.id); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                          >
                            👥
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditClick(p); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Team modal */}
        {teamProjectId && (
          <ProjectTeamModal
            projectId={teamProjectId}
            onClose={() => setTeamProjectId(null)}
          />
        )}
      </div>
      <ConfirmModal {...confirmProps} />
    </>
  );
};

export default ProjectsPage;
