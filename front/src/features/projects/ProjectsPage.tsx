import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project, ProjectStatus } from "./types";
import type { User } from "../users/types";
import { projectService } from "./projectService";
import { userService } from "../users/userService";
import { projectMemberService } from "./projectMemberService";
import { authStore } from "../../shared/auth/authStore";
import { useToast } from "../../shared/context/ToastContext";
import { useProjectsPaged } from "../../shared/hooks/useProjectQuery";
import { useCompanies } from "../../shared/hooks/useCompanyQuery";
import { useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "../../shared/hooks/useProjectQuery";
import Pagination from "../../shared/ui/Pagination";
import { usePagination } from "../../shared/hooks/usePagination";
import Modal from "../../shared/ui/Modal";
import ProjectForm from "./components/ProjectForm";
import ProjectTeamModal from "./components/ProjectTeamModal";
import EmptyState from "../../shared/ui/EmptyState";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { CardsSkeleton } from "../../shared/ui/Skeleton";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  InProgress: {
    label: "En curso",
    dot: "bg-sky-400",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/20",
  },
  Planned: {
    label: "Planificado",
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
  Paused: {
    label: "Pausado",
    dot: "bg-slate-400",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
  },
  Done: {
    label: "Finalizado",
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ── React Query ──
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "">("");

  const {
    page,
    pageSize,
    search,
    handleSearch,
    params: baseParams,
    setPage,
    setPageSize,
  } = usePagination();
  const params = { ...baseParams, status: filterStatus || undefined };

  const { data, isLoading: loading } = useProjectsPaged(params);
  const projects = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const { data: companiesData = [] } = useCompanies();

  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [teamProjectId, setTeamProjectId] = useState<number | null>(null);
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  const handleStatusFilter = (val: ProjectStatus | "") => {
    setFilterStatus(val);
    setPage(1);
  };

  const canCreate = authStore.hasPermission("projects.create");
  const canEdit = authStore.hasPermission("projects.edit");
  const canDelete = authStore.hasPermission("projects.delete");

  // They need companies data if they might create or edit a project
  const companies = (canCreate || canEdit) ? companiesData : [];

  useEffect(() => {
    if (canCreate || canEdit) {
      userService.getAll().then(setUsers).catch(console.error);
    }
  }, [canCreate, canEdit]);

  const handleNewClick = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleCreate = async (data: Partial<Project>, memberIds?: number[]) => {
    const newProject = await projectService.create(data);
    if (memberIds && memberIds.length > 0) {
      await Promise.all(memberIds.map((userId) => projectMemberService.add(newProject.id, userId)));
    }
    qc.invalidateQueries({ queryKey: projectKeys.all });
    setShowForm(false);
    addToast("success", "Proyecto creado correctamente");
  };

  const handleUpdate = async (data: Partial<Project>) => {
    if (!editing) return;
    await projectService.update(editing.id, data);
    qc.invalidateQueries({ queryKey: projectKeys.all });
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
    qc.invalidateQueries({ queryKey: projectKeys.all });
    addToast("success", "Proyecto eliminado");
  };

  const handleEditClick = (project: Project) => {
    setEditing(project);
    setShowForm(true);
  };
  const handleCancelForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  const handleStatusChange = async (projectId: number, newStatus: ProjectStatus) => {
    try {
      await projectService.update(projectId, { status: newStatus });
      qc.invalidateQueries({ queryKey: projectKeys.all });
      addToast("success", "Estado actualizado");
    } catch {
      addToast("error", "Error al cambiar estado");
    }
  };

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
              {totalCount} {totalCount === 1 ? "proyecto" : "proyectos"}
            </p>
          </div>

          {canCreate && (
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

        {canCreate && companies.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <span>⚠️</span>
            Para crear proyectos primero necesitás cargar al menos una empresa.
          </div>
        )}

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre o empresa..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => handleStatusFilter("")}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${!filterStatus
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-slate-700/10 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                }`}
            >
              Todos
            </button>
            {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${filterStatus === s
                    ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} border ${STATUS_CONFIG[s].border}`
                    : "bg-slate-700/10 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        <Modal
          open={showForm && (canCreate || canEdit)}
          onClose={handleCancelForm}
          title={editing ? "✏️ Editar proyecto" : "📁 Nuevo proyecto"}
        >
          <ProjectForm
            initial={editing ?? {}}
            companies={companies}
            users={users}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </Modal>

        {/* Project Cards */}
        {loading ? (
          <CardsSkeleton count={6} />
        ) : projects.length === 0 ? (
          search.trim() === "" && !filterStatus ? (
            <EmptyState
              icon="📁"
              title="Sin proyectos"
              description="Creá tu primer proyecto para empezar a organizar las tareas de tu equipo."
              actionLabel={canCreate ? "+ Nuevo proyecto" : undefined}
              onAction={canCreate ? handleNewClick : undefined}
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
            {projects.map((p: Project) => {
              const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.Planned;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-700/60 transition-all cursor-pointer gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Status dot */}
                    <div
                      className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-slate-200">{p.name}</p>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border} shrink-0`}
                        >
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
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0 flex-wrap">
                    {p.estimatedHours && (
                      <span className="text-xs text-slate-600 tabular-nums hidden lg:inline mr-4">
                        {p.estimatedHours}h est.
                      </span>
                    )}
                    <div className="w-px h-6 bg-slate-700/50 hidden lg:block" />
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      {canEdit && (
                        <StatusDropdown
                          currentStatus={p.status}
                          onChangeStatus={(s: ProjectStatus) => handleStatusChange(p.id, s)}
                        />
                      )}
                      {!canEdit && (
                        <span className={`px-2 py-1 text-[10px] font-medium rounded-lg ${STATUS_CONFIG[p.status]?.bg} ${STATUS_CONFIG[p.status]?.text} border ${STATUS_CONFIG[p.status]?.border}`}>
                          {STATUS_CONFIG[p.status]?.label}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${p.id}/board`);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all"
                      >
                        📋 Tablero
                      </button>

                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTeamProjectId(p.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all"
                          title="Gestionar Equipo"
                        >
                          👥
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(p);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
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

        {/* Team modal */}
        {teamProjectId && (
          <ProjectTeamModal projectId={teamProjectId} onClose={() => setTeamProjectId(null)} />
        )}
      </div>
      <ConfirmModal {...confirmProps} />
    </>
  );
};

export default ProjectsPage;

/* ── Inline Status Dropdown ── */
const StatusDropdown = ({
  currentStatus,
  onChangeStatus,
}: {
  currentStatus: ProjectStatus;
  onChangeStatus: (s: ProjectStatus) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const statuses: ProjectStatus[] = ["Planned", "InProgress", "Paused", "Done"];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-all"
        title="Cambiar estado"
      >
        🔄 Estado
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-700/60 rounded-xl shadow-xl py-1 min-w-[130px] animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {statuses.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = s === currentStatus;
            return (
              <button
                key={s}
                onClick={() => {
                  onChangeStatus(s);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition ${isActive
                    ? `${cfg.bg} ${cfg.text} font-medium`
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
                {isActive && <span className="ml-auto text-[9px]">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
