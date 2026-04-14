import React, { useState, useEffect } from "react";
import Modal from "../../../shared/ui/Modal";
import { type Workspace, useWorkspaceUsers, useAssignWorkspaceUser, useRemoveWorkspaceUser } from "../../../shared/hooks/useWorkspaceQuery";
import { useToast } from "../../../shared/context/ToastContext";
import { useConfirm } from "../../../shared/ui/useConfirm";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { userService } from "../../users/userService";
import { rolesApi } from "../../roles/rolesService";
import type { User } from "../../users/types";

interface Props {
    workspace: Workspace;
    onClose: () => void;
}

const WorkspaceUsersModal: React.FC<Props> = ({ workspace, onClose }) => {
    const { data: workspaceUsers = [], isLoading } = useWorkspaceUsers(workspace.id);
    const assignMutation = useAssignWorkspaceUser();
    const removeMutation = useRemoveWorkspaceUser();
    const { addToast } = useToast();
    const { confirm, confirmProps } = useConfirm();

    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");

    // Load global users and roles to populate dropdowns
    useEffect(() => {
        userService.getAll().then(setAvailableUsers);
        rolesApi.getAll().then((r) => setRoles(r.map(x => ({ id: x.id, name: x.name }))));
    }, []);

    const handleAssign = async () => {
        if (!selectedUserId || !selectedRoleId) return;
        try {
            await assignMutation.mutateAsync({
                tenantId: workspace.id,
                userId: Number(selectedUserId),
                roleId: Number(selectedRoleId),
            });
            addToast("success", "Usuario asignado correctamente.");
            setSelectedUserId(""); // reset
        } catch {
            // Handled by interceptor
        }
    };

    const handleRemove = async (userId: number, userName: string) => {
        const ok = await confirm({
            title: "Desvincular usuario",
            message: `¿Estás seguro de quitar a "${userName}" de la empresa "${workspace.name}"?`,
            confirmLabel: "Sí, desvincular",
            variant: "danger",
        });
        if (!ok) return;

        try {
            await removeMutation.mutateAsync({ tenantId: workspace.id, userId });
            addToast("success", "Usuario desvinculado.");
        } catch {
            // Handled by interceptor
        }
    };

    return (
        <>
            <Modal open={true} onClose={onClose} title={`Administrar Personal: ${workspace.name}`} maxWidth="3xl">
                <div className="space-y-6">
                    {/* Asignación (Formulario arriba) */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <span>✨</span> Agregar empleado a la empresa
                        </h4>
                        <div className="flex flex-col sm:flex-row items-end gap-3">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-0.5">Usuario</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {availableUsers.map((u) => {
                                        const isAlreadyAssigned = workspaceUsers.some(wu => wu.userId === u.id);
                                        const isSuper = u.isSuperAdmin;
                                        return (
                                            <option key={u.id} value={u.id} disabled={isAlreadyAssigned || isSuper}>
                                                {u.fullName} {isAlreadyAssigned ? "(Ya asignado)" : isSuper ? "(SuperAdmin - Acceso Global)" : ""}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-0.5">Rol asignado</label>
                                <select
                                    value={selectedRoleId}
                                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={handleAssign}
                                disabled={!selectedUserId || !selectedRoleId || assignMutation.isPending}
                                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                Asignar
                            </button>
                        </div>
                    </div>

                    {/* Lista actual */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <span>👥</span> Personal actual ({workspaceUsers.length})
                        </h4>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                            </div>
                        ) : workspaceUsers.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/10 border-2 border-dashed border-slate-200 dark:border-slate-700/60 text-center">
                                <p className="text-sm font-medium text-slate-500">No hay nadie asignado aún. Podés buscar usuarios arriba para sumarlos a este equipo.</p>
                            </div>
                        ) : (
                            <div className="border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-5 py-3.5">Nombre</th>
                                            <th className="px-5 py-3.5">Email</th>
                                            <th className="px-5 py-3.5">Rol</th>
                                            <th className="px-5 py-3.5 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-900/20">
                                        {workspaceUsers.map((u) => (
                                            <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium">{u.fullName}</td>
                                                <td className="px-5 py-3 text-slate-500">{u.email}</td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-600 dark:bg-slate-800 dark:text-slate-300 border border-indigo-100 dark:border-slate-700">
                                                        {u.roleName}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => handleRemove(u.userId, u.fullName)}
                                                        className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
                                                    >
                                                        Desvincular
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <ConfirmModal {...confirmProps} />
        </>
    );
};

export default WorkspaceUsersModal;
