import React, { useState } from "react";
import { useWorkspaces } from "../../shared/hooks/useWorkspaceQuery";
import type { Workspace } from "../../shared/hooks/useWorkspaceQuery";
import EmptyState from "../../shared/ui/EmptyState";
import { CardsSkeleton } from "../../shared/ui/Skeleton";
import Modal from "../../shared/ui/Modal";
import WorkspaceForm from "../workspaces/components/WorkspaceForm";
import WorkspaceUsersModal from "../workspaces/components/WorkspaceUsersModal";
import { authStore } from "../../shared/auth/authStore";
import { loadPreferences } from "../../shared/theme/themeEngine";

const AdminCompaniesPage: React.FC = () => {
    const { data: workspaces = [], isLoading } = useWorkspaces();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Workspace | null>(null);
    const [managingUsers, setManagingUsers] = useState<Workspace | null>(null);
    const prefs = loadPreferences();
    const isLight = prefs.theme.startsWith("light");

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
            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>Empresas</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Administración global de todas las empresas del sistema
                        </p>
                    </div>
                    <button
                        onClick={handleNewClick}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-sm active:scale-[0.97]"
                        style={{ backgroundColor: prefs.accentColor }}
                    >
                        + Nueva Empresa
                    </button>
                </div>

                {/* Stats bar */}
                {!isLoading && workspaces.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/40 border-slate-700/50"}`}>
                            <p className={`text-2xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{workspaces.length}</p>
                            <p className="text-xs text-slate-500 mt-1">Empresas totales</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/40 border-slate-700/50"}`}>
                            <p className="text-2xl font-bold text-emerald-500">{workspaces.filter(w => w.active).length}</p>
                            <p className="text-xs text-slate-500 mt-1">Activas</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/40 border-slate-700/50"}`}>
                            <p className="text-2xl font-bold text-red-500">{workspaces.filter(w => !w.active).length}</p>
                            <p className="text-xs text-slate-500 mt-1">Inactivas</p>
                        </div>
                    </div>
                )}

                {/* Companies list */}
                {isLoading ? (
                    <CardsSkeleton count={3} />
                ) : workspaces.length === 0 ? (
                    <EmptyState
                        icon="🏢"
                        title="Sin Empresas"
                        description="Creá la primera empresa para iniciar."
                        actionLabel="+ Nueva Empresa"
                        onAction={handleNewClick}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workspaces.map((w) => (
                            <div
                                key={w.id}
                                className={`group p-5 rounded-2xl border hover:scale-[1.01] transition-all flex flex-col ${isLight ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600"}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className={`text-lg font-bold ${isLight ? "text-slate-800" : "text-slate-100"}`}>{w.name}</h4>
                                        <p className="text-xs font-mono text-slate-500 mt-1">Slug: {w.slug}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            w.active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                        }`}
                                    >
                                        {w.active ? "Activo" : "Inactivo"}
                                    </span>
                                </div>

                                <div className={`mt-auto pt-4 border-t flex items-center justify-between ${isLight ? "border-slate-100" : "border-slate-700/50"}`}>
                                    <span className="text-xs text-slate-400 font-medium">Plan: {w.plan}</span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => authStore.switchWorkspace(w.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                                        >
                                            🚀 Ingresar
                                        </button>
                                        <button
                                            onClick={() => handleManageUsers(w)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                            style={{ color: prefs.accentColor, backgroundColor: prefs.accentColor + "15" }}
                                        >
                                            👥 Personal
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(w)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isLight ? "text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200" : "text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700"}`}
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

export default AdminCompaniesPage;
