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


            {/* ═══════════════ TOP BAR (PREMIUM) ═══════════════ */}
            <header className="relative z-30 pt-4 px-4 sm:px-6">
                <div className={`max-w-6xl mx-auto h-16 rounded-2xl border flex items-center justify-between px-4 sm:px-6 shadow-sm backdrop-blur-xl transition-all duration-300 ${isLight ? "bg-white/90 border-slate-200/80 shadow-slate-200/50" : "bg-slate-900/80 border-slate-700/50 shadow-black/20"}`}>
                    
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-[14px] flex items-center justify-center text-lg font-bold text-white shadow-lg relative overflow-hidden group"
                            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <span className="relative z-10">F</span>
                        </div>
                        <div className="hidden sm:flex flex-col justify-center">
                            <h1 className={`text-[15px] leading-tight font-extrabold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>
                                CRM <span style={{ color: accent }}>F360</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Gestión Inteligente</p>
                        </div>
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Elegant Profile Pill */}
                        <div className={`flex items-center gap-3 pl-3 pr-1.5 py-1.5 rounded-full border transition-all duration-300 shadow-sm ${isLight ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md" : "bg-slate-950/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800"}`}>
                            <div className="text-right hidden md:block">
                                <p className={`text-[13px] font-bold leading-tight ${isLight ? "text-slate-800" : "text-slate-200"}`}>{user?.fullName}</p>
                                <p className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: accent }}>{user?.roles?.[0]}</p>
                            </div>
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner"
                                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
                            >
                                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className={`hidden sm:block w-[1px] h-6 ${isLight ? "bg-slate-200" : "bg-slate-700"}`} />

                        {/* Polished Logout Button */}
                        <button
                            onClick={() => authStore.logout()}
                            className={`flex items-center justify-center w-10 h-10 sm:w-auto sm:px-4 sm:h-10 rounded-xl font-medium text-sm transition-all duration-300 active:scale-95 group ${isLight ? "text-slate-500 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"}`}
                            aria-label="Cerrar sesión"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:mr-2 transition-transform group-hover:translate-x-0.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
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
                                className={`group relative px-7 py-3.5 text-sm font-bold rounded-2xl border transition-all duration-500 flex items-center gap-3 overflow-hidden shadow-sm active:scale-95 ${isLight ? "border-slate-200 hover:shadow-lg hover:-translate-y-0.5" : "border-slate-800 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5"}`}
                                style={{
                                    backgroundColor: isLight ? "#ffffff" : accent + "10",
                                    color: accent,
                                }}
                            >
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${accent}15, transparent)`,
                                    }}
                                />
                                <span className="text-lg transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-180 drop-shadow-sm">⚙️</span>
                                <span className="relative z-10 tracking-wide drop-shadow-sm">Administrar Empresas</span>
                                
                                {/* Glow effect */}
                                <div className="absolute inset-0 border-2 rounded-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 group-hover:animate-pulse pointer-events-none" 
                                    style={{ borderColor: accent }}
                                />
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
