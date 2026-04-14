import React, { useState, useRef, useEffect } from "react";
import { authStore } from "../auth/authStore";
import { useIsLight } from "../hooks/useIsLight";

const WorkspaceSwitcher: React.FC = () => {
    const user = authStore.user;
    const workspaces = user?.availableWorkspaces || [];
    const currentTenantId = user?.tenantId;
    const isSuperAdmin = user?.isSuperAdmin;
    const isLight = useIsLight();

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
                <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    Empresa activa
                </span>
                <p className={`mt-1 text-sm font-medium truncate ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    {user?.tenantName || "Predeterminada"}
                </p>
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
            <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block px-1 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                Sucursal actual
            </span>

            {/* ── Trigger button ── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between rounded-lg p-2.5 text-left transition-all duration-200 border ${
                    isLight
                        ? "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white shadow-sm"
                        : "bg-slate-900 border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80"
                }`}
            >
                <span className={`text-sm font-medium truncate flex-1 pr-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                    {currentWorkspace?.name || user.tenantName || "Seleccionar..."}
                </span>
                <svg
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isLight ? "text-slate-400" : "text-slate-500"}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* ── Dropdown ── */}
            {isOpen && (
                <div
                    className={`absolute z-50 mt-1.5 w-full rounded-xl overflow-hidden border ${
                        isLight
                            ? "bg-white border-slate-200 shadow-xl shadow-slate-200/80"
                            : "bg-slate-800 border-slate-700 shadow-xl shadow-black/40"
                    }`}
                    style={{ animation: "workspace-dropdown-in 0.15s ease-out" }}
                >
                    <div className="max-h-48 overflow-y-auto">
                        {workspaces.map((w) => {
                            const isActive = w.id === currentTenantId;
                            return (
                                <button
                                    key={w.id}
                                    onClick={() => handleSwitch(w.id)}
                                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                                        isActive
                                            ? isLight
                                                ? "bg-indigo-50 text-indigo-600 font-medium"
                                                : "bg-indigo-500/20 text-indigo-400 font-medium"
                                            : isLight
                                                ? "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {isActive && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                        )}
                                        {w.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Back to admin panel — SuperAdmin or multi-workspace users */}
                    {(isSuperAdmin || workspaces.length > 1) && (
                        <div className={`border-t ${isLight ? "border-slate-100" : "border-slate-700"}`}>
                            <button
                                onClick={() => { setIsOpen(false); authStore.exitWorkspace(); }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                                    isLight
                                        ? "text-amber-600 hover:bg-amber-50"
                                        : "text-amber-400 hover:bg-amber-500/10"
                                }`}
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
