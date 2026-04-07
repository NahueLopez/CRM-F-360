import React, { useState } from "react";
import { useWorkspaces } from "../../shared/hooks/useWorkspaceQuery";
import type { Workspace } from "../../shared/hooks/useWorkspaceQuery";
import EmptyState from "../../shared/ui/EmptyState";
import { CardsSkeleton } from "../../shared/ui/Skeleton";
import Modal from "../../shared/ui/Modal";
import WorkspaceForm from "./components/WorkspaceForm";
import WorkspaceUsersModal from "./components/WorkspaceUsersModal";
import { authStore } from "../../shared/auth/authStore";
const WorkspacesPage: React.FC = () => {
    const { data: workspaces = [], isLoading } = useWorkspaces();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Workspace | null>(null);
    const [managingUsers, setManagingUsers] = useState<Workspace | null>(null);

    const handleNewClick = () => {
        setEditing(null);
        setShowForm(true);
    };

    const handleEditClick = (w: Workspace) => {
        setEditing(w);
        setShowForm(true);
    };

    const handleManageUsers = (w: Workspace) => {
        setManagingUsers(w);
    };

    const handleCloseForm = () => {
        setEditing(null);
        setShowForm(false);
    };

    return (
        <>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">Sucursales / Empresas</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Administración de empresas propias del sistema
                        </p>
                    </div>
                    <button
                        onClick={handleNewClick}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.97]"
                    >
                        + Nueva Empresa
                    </button>
                </div>

                {isLoading ? (
                    <CardsSkeleton count={3} />
                ) : workspaces.length === 0 ? (
                    <EmptyState
                        icon="🏢"
                        title="Sin Sucursales"
                        description="Creá la empresa principal para iniciar."
                        actionLabel="+ Nueva Empresa"
                        onAction={handleNewClick}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workspaces.map((w) => (
                            <div
                                key={w.id}
                                className="group p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 transition-all flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-100">{w.name}</h4>
                                        <p className="text-xs font-mono text-slate-500 mt-1">Slug: {w.slug}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${w.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                            }`}
                                    >
                                        {w.active ? "Activo" : "Inactivo"}
                                    </span>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Plan: {w.plan}</span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => authStore.switchWorkspace(w.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                                        >
                                            🚀 Ingresar
                                        </button>
                                        <button
                                            onClick={() => handleManageUsers(w)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
                                        >
                                            👥 Personal
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(w)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 transition-all"
                                        >
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Modal open={showForm} onClose={handleCloseForm} title={editing ? "Editar Empresa" : "Nueva Empresa"}>
                <WorkspaceForm initial={editing || {}} isEditing={!!editing} onClose={handleCloseForm} />
            </Modal>

            {managingUsers && (
                <WorkspaceUsersModal
                    workspace={managingUsers}
                    onClose={() => setManagingUsers(null)}
                />
            )}
        </>
    );
};

export default WorkspacesPage;
