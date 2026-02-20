import React, { useEffect, useState } from "react";
import type { ProjectMember } from "../memberTypes";
import type { User } from "../../users/types";
import { projectMemberService } from "../projectMemberService";
import { userService } from "../../users/userService";
import ConfirmModal from "../../../shared/ui/ConfirmModal";
import { useConfirm } from "../../../shared/ui/useConfirm";

interface Props {
    projectId: number;
    onClose: () => void;
}

const ProjectTeamModal: React.FC<Props> = ({ projectId, onClose }) => {
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [addUserId, setAddUserId] = useState<number | "">("");
    const [addRole, setAddRole] = useState("Member");
    const { confirm, confirmProps } = useConfirm();

    const loadData = async () => {
        try {
            setLoading(true);
            const [m, u] = await Promise.all([
                projectMemberService.getByProject(projectId),
                userService.getAll(),
            ]);
            setMembers(m);
            setAllUsers(u);
        } catch (err) {
            console.error("Error loading team", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    const availableUsers = allUsers.filter(
        (u) => !members.some((m) => m.userId === u.id)
    );

    const handleAdd = async () => {
        if (!addUserId) return;
        try {
            await projectMemberService.add(projectId, addUserId as number, addRole);
            setAddUserId("");
            setAddRole("Member");
            await loadData();
        } catch (err) {
            console.error("Error adding member", err);
        }
    };

    const handleRemove = async (userId: number) => {
        const member = members.find(m => m.userId === userId);
        const ok = await confirm({
            title: "Remover miembro",
            message: `¿Remover a ${member?.userName ?? "este miembro"} del proyecto?`,
            confirmLabel: "Sí, remover",
            variant: "warning",
        });
        if (!ok) return;
        try {
            await projectMemberService.remove(projectId, userId);
            await loadData();
        } catch (err) {
            console.error("Error removing member", err);
        }
    };

    const handleRoleChange = async (userId: number, role: string) => {
        try {
            await projectMemberService.updateRole(projectId, userId, role);
            await loadData();
        } catch (err) {
            console.error("Error updating role", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Equipo del proyecto</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {members.length} miembro{members.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-xl transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Add member */}
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30">
                    <p className="text-xs text-slate-400 mb-2 font-medium">Agregar miembro</p>
                    <div className="flex gap-2">
                        <select
                            value={addUserId}
                            onChange={(e) => setAddUserId(e.target.value ? Number(e.target.value) : "")}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
                        >
                            <option value="">Seleccionar usuario...</option>
                            {availableUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.fullName} ({u.email})
                                </option>
                            ))}
                        </select>
                        <select
                            value={addRole}
                            onChange={(e) => setAddRole(e.target.value)}
                            className="w-28 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
                        >
                            <option value="Lead">Lead</option>
                            <option value="Member">Member</option>
                        </select>
                        <button
                            onClick={handleAdd}
                            disabled={!addUserId}
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40
                disabled:cursor-not-allowed text-sm font-medium text-white transition"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Members list */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {loading ? (
                        <p className="text-sm text-slate-500 text-center py-4">Cargando...</p>
                    ) : members.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                            No hay miembros asignados. Agregá usuarios al proyecto.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {members.map((m) => (
                                <div
                                    key={m.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50
                    border border-slate-700/50 hover:border-slate-600 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30
                        flex items-center justify-center text-xs font-bold text-indigo-300"
                                        >
                                            {m.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{m.userName}</p>
                                            <p className="text-[10px] text-slate-500">{m.userEmail}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select
                                            value={m.role}
                                            onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                                            className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-xs text-slate-200"
                                        >
                                            <option value="Lead">Lead</option>
                                            <option value="Member">Member</option>
                                        </select>
                                        <button
                                            onClick={() => handleRemove(m.userId)}
                                            className="text-red-400 hover:text-red-300 text-xs transition px-1"
                                            title="Remover"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-slate-600 text-sm text-slate-300
              hover:bg-slate-800 transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
            <ConfirmModal {...confirmProps} />
        </div>
    );
};

export default ProjectTeamModal;
