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
            <Modal open={true} onClose={onClose} title={`Personal: ${workspace.name}`} maxWidth="3xl">
                <div className="space-y-6">
                    {/* Asignación (Formulario arriba) */}
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Agregar usuario a la empresa</h4>
                        <div className="flex flex-col sm:flex-row items-end gap-3">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Usuario</label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {availableUsers.map((u) => (
                                        <option key={u.id} value={u.id} disabled={workspaceUsers.some(wu => wu.userId === u.id)}>
                                            {u.fullName} {workspaceUsers.some(wu => wu.userId === u.id) ? "(Ya asignado)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Rol</label>
                                <select
                                    value={selectedRoleId}
                                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                            >
                                Asignar
                            </button>
                        </div>
                    </div>

                    {/* Lista actual */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Personal ({workspaceUsers.length})</h4>
                        {isLoading ? (
                            <p className="text-sm text-slate-500">Cargando usuarios...</p>
                        ) : workspaceUsers.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center">
                                <p className="text-sm text-slate-500">No hay personal asignado a esta empresa.</p>
                            </div>
                        ) : (
                            <div className="border border-slate-700/50 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-slate-800/40 text-xs text-slate-400 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Nombre</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Rol</th>
                                            <th className="px-4 py-3 font-medium text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {workspaceUsers.map((u) => (
                                            <tr key={u.userId} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="px-4 py-3 text-slate-200">{u.fullName}</td>
                                                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-slate-700 text-slate-300">
                                                        {u.roleName}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleRemove(u.userId, u.fullName)}
                                                        className="text-xs font-medium text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded transition-colors"
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
