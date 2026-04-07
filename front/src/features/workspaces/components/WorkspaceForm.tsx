import React, { useState } from "react";
import { useCreateWorkspace, useUpdateWorkspace } from "../../../shared/hooks/useWorkspaceQuery";
import { useToast } from "../../../shared/context/ToastContext";

interface FormValues {
    name: string;
    slug: string;
    plan: string;
    active: boolean;
}

interface Props {
    initial: Partial<FormValues> & { id?: number };
    isEditing: boolean;
    onClose: () => void;
}

const WorkspaceForm: React.FC<Props> = ({ initial, isEditing, onClose }) => {
    const { addToast } = useToast();
    const createMutation = useCreateWorkspace();
    const updateMutation = useUpdateWorkspace();

    const [formData, setFormData] = useState<FormValues>({
        name: initial.name || "",
        slug: initial.slug || "",
        plan: initial.plan || "Free",
        active: initial.active ?? true,
    });

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.slug) {
            addToast("error", "El nombre y slug son obligatorios");
            return;
        }

        try {
            if (isEditing && initial.id) {
                await updateMutation.mutateAsync({ id: initial.id, data: formData });
                addToast("success", "Empresa actualizada correctamente.");
            } else {
                await createMutation.mutateAsync({ name: formData.name, slug: formData.slug, plan: formData.plan });
                addToast("success", "Empresa creada correctamente.");
            }
            onClose();
        } catch {
            // Handled by api interceptor
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <form onSubmit={onSubmit} className="space-y-4 text-left">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de la empresa</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: RL Servicios"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug (Identificador)</label>
                <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ej: rl-servicios"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Plan</label>
                <select
                    value={formData.plan}
                    onChange={e => setFormData({ ...formData, plan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                </select>
            </div>

            {isEditing && (
                <div className="flex items-center gap-2 mt-4 pt-2">
                    <input
                        type="checkbox"
                        id="active"
                        checked={formData.active}
                        onChange={e => setFormData({ ...formData, active: e.target.checked })}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-slate-300">Empresa Activa</label>
                </div>
            )}

            <div className="flex justify-end pt-4 gap-3 border-t border-slate-700/50 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                >
                    {isPending ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </form>
    );
};

export default WorkspaceForm;
