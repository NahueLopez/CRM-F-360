import React, { useState } from "react";
import { authStore } from "../../shared/auth/authStore";
import { Navigate } from "react-router-dom";
import { loadPreferences } from "../../shared/theme/themeEngine";

const WorkspaceSelectPage: React.FC = () => {
    const user = authStore.user;
    const [switching, setSwitching] = useState(false);
    const prefs = loadPreferences();
    const isLight = prefs.theme.startsWith("light");
    const accent = prefs.accentColor;

    if (!user) return <Navigate to="/login" replace />;

    const workspaces = user.availableWorkspaces || [];
    const isSuperAdmin = user.isSuperAdmin;

    const handleSelect = async (id: number) => {
        setSwitching(true);
        await authStore.switchWorkspace(id, "/");
    };

    // ── No workspaces assigned (regular user) ──
    if (workspaces.length === 0 && !isSuperAdmin) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${isLight ? "bg-white" : "bg-slate-900"}`}>
                <div className="max-w-md w-full text-center space-y-6">
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800"}`}>
                        🏢
                    </div>
                    <h1 className={`text-2xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>Sin empresas asignadas</h1>
                    <p className={`text-sm leading-relaxed ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Tu cuenta no tiene ninguna empresa asignada. Contactá al administrador.
                    </p>
                    <button
                        onClick={() => authStore.logout()}
                        className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all border ${isLight ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm" : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"}`}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        );
    }

    // ── Card color palette (theme-aware) ──
    const cardColors = isLight
        ? [
            { bg: "from-indigo-50 to-indigo-100/60", border: "border-indigo-200/80", icon: "bg-indigo-100 text-indigo-600" },
            { bg: "from-emerald-50 to-emerald-100/60", border: "border-emerald-200/80", icon: "bg-emerald-100 text-emerald-600" },
            { bg: "from-amber-50 to-amber-100/60", border: "border-amber-200/80", icon: "bg-amber-100 text-amber-600" },
            { bg: "from-rose-50 to-rose-100/60", border: "border-rose-200/80", icon: "bg-rose-100 text-rose-600" },
            { bg: "from-cyan-50 to-cyan-100/60", border: "border-cyan-200/80", icon: "bg-cyan-100 text-cyan-600" },
            { bg: "from-purple-50 to-purple-100/60", border: "border-purple-200/80", icon: "bg-purple-100 text-purple-600" },
        ]
        : [
            { bg: "from-indigo-500/20 to-violet-500/10", border: "border-indigo-500/30", icon: "bg-indigo-500/20 text-indigo-400" },
            { bg: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30", icon: "bg-emerald-500/20 text-emerald-400" },
            { bg: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/30", icon: "bg-amber-500/20 text-amber-400" },
            { bg: "from-rose-500/20 to-pink-500/10", border: "border-rose-500/30", icon: "bg-rose-500/20 text-rose-400" },
            { bg: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/30", icon: "bg-cyan-500/20 text-cyan-400" },
            { bg: "from-purple-500/20 to-fuchsia-500/10", border: "border-purple-500/30", icon: "bg-purple-500/20 text-purple-400" },
        ];

    return (
        <div className="min-h-screen flex flex-col overflow-hidden relative bg-transparent">


            {/* ═══════════════ TOP BAR ═══════════════ */}
            <header className={`relative z-10 border-b backdrop-blur-sm ${isLight ? "border-slate-200/80 bg-white/70" : "border-slate-800/50 bg-slate-950/80"}`}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md"
                            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
                        >
                            F
                        </div>
                        <div>
                            <h1 className={`text-sm font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                                CRM <span style={{ color: accent }}>F360</span>
                            </h1>
                            <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>Gestión integral de negocios</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
                                style={{ backgroundColor: accent }}
                            >
                                {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <span className={`text-xs font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                                {user.fullName}
                            </span>
                        </div>
                        <button
                            onClick={() => authStore.logout()}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${isLight ? "text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border-slate-200" : "text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border-slate-700"}`}
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-3xl space-y-8">
                    {/* Heading */}
                    <div className="text-center space-y-3">
                        <div
                            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-2xl border shadow-lg ${isLight ? "bg-white border-slate-200 shadow-slate-200/60" : "bg-slate-900 border-slate-800 shadow-slate-900/50"}`}
                        >
                            {isSuperAdmin ? "⚡" : "🏢"}
                        </div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>
                            {isSuperAdmin ? "Panel de Administración" : "Seleccioná tu empresa"}
                        </h2>
                        <p className={`text-sm max-w-md mx-auto ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                            {isSuperAdmin
                                ? "Administrá el sistema o seleccioná una empresa para ingresar."
                                : "Elegí la empresa con la que querés trabajar."}
                        </p>
                    </div>

                    {/* SuperAdmin Quick Actions */}
                    {isSuperAdmin && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => window.location.replace("/admin")}
                                className="px-6 py-3 text-sm font-semibold rounded-xl border transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
                                style={{
                                    backgroundColor: accent + "15",
                                    borderColor: accent + "30",
                                    color: accent,
                                }}
                            >
                                <span>⚙️</span>
                                Administrar Empresas
                            </button>
                        </div>
                    )}

                    {/* Company cards */}
                    {switching ? (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <div
                                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: accent, borderTopColor: "transparent" }}
                            />
                            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-500"}`}>Ingresando a la empresa…</p>
                        </div>
                    ) : workspaces.length === 0 ? (
                        <div className="text-center py-12">
                            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                                No hay empresas creadas. Usá el panel de administración para crear una.
                            </p>
                        </div>
                    ) : (
                        <div className={`grid gap-4 ${
                            workspaces.length === 1
                                ? "grid-cols-1 max-w-sm mx-auto"
                                : workspaces.length === 2
                                    ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        }`}>
                            {workspaces.map((ws, i) => {
                                const color = cardColors[i % cardColors.length];
                                return (
                                    <button
                                        key={ws.id}
                                        onClick={() => handleSelect(ws.id)}
                                        className={`group relative p-6 rounded-2xl bg-gradient-to-br ${color.bg} border ${color.border} hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 text-left cursor-pointer ${isLight ? "shadow-sm hover:shadow-lg" : "hover:shadow-lg hover:shadow-black/20"}`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-11 h-11 rounded-xl ${color.icon} flex items-center justify-center text-xl mb-4 transition-transform group-hover:scale-110`}>
                                            🏢
                                        </div>

                                        {/* Name */}
                                        <h3 className={`text-lg font-bold mb-2 ${isLight ? "text-slate-800 group-hover:text-slate-900" : "text-white group-hover:text-white"}`}>
                                            {ws.name}
                                        </h3>

                                        <div className="mt-3 flex items-center justify-end">
                                            <span
                                                className="text-xs font-medium flex items-center gap-1 transition-all group-hover:gap-2"
                                                style={{ color: accent }}
                                            >
                                                Ingresar
                                                <span className="transition-transform group-hover:translate-x-0.5">→</span>
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* ═══════════════ FOOTER ═══════════════ */}
            <footer className={`relative z-10 border-t ${isLight ? "border-slate-200/80" : "border-slate-800/50"}`}>
                <div className="max-w-5xl mx-auto px-6 py-3 text-center">
                    <p className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-600"}`}>
                        © {new Date().getFullYear()} CRM F360 — Todos los derechos reservados
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default WorkspaceSelectPage;
