import React, { useState, useRef, useEffect } from "react";
import { authStore } from "../auth/authStore";

const WorkspaceSwitcher: React.FC = () => {
    const user = authStore.user;
    const workspaces = user?.availableWorkspaces || [];
    const currentTenantId = user?.tenantId;
    const isSuperAdmin = user?.isSuperAdmin;

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    if (!user) return null;

    // Single workspace, non-SuperAdmin: just show the name
    if (workspaces.length <= 1 && !isSuperAdmin) {
        return (
            <div className="mt-4 px-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa activa</span>
                <p className="mt-1 text-sm font-medium text-slate-300 truncate">{user?.tenantName || "Predeterminada"}</p>
            </div>
        );
    }

    const currentWorkspace = workspaces.find((w) => w.id === currentTenantId);

    const handleSwitch = async (id: number) => {
        setIsOpen(false);
        if (id === currentTenantId) return;
        await authStore.switchWorkspace(id);
    };

    return (
        <div className="mt-4 relative" ref={dropdownRef}>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block px-1">Sucursal actual</span>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-slate-900 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all rounded-lg p-2 text-left"
            >
                <span className="text-sm font-medium text-slate-200 truncate flex-1 pr-2">
                    {currentWorkspace?.name || user.tenantName || "Seleccionar..."}
                </span>
                <span className="text-slate-400 text-xs shrink-0">▼</span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/40 overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                        {workspaces.map((w) => (
                            <button
                                key={w.id}
                                onClick={() => handleSwitch(w.id)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${w.id === currentTenantId
                                        ? "bg-indigo-500/20 text-indigo-400 font-medium"
                                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                                    }`}
                            >
                                {w.name}
                            </button>
                        ))}
                    </div>

                    {/* Back to admin panel — SuperAdmin or multi-workspace users */}
                    {(isSuperAdmin || workspaces.length > 1) && (
                        <div className="border-t border-slate-700">
                            <button
                                onClick={() => { setIsOpen(false); authStore.exitWorkspace(); }}
                                className="w-full text-left px-3 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-2"
                            >
                                ↩ Volver al panel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkspaceSwitcher;
