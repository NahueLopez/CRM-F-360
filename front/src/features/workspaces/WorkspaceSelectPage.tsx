import React, { useState } from "react";
import { authStore } from "../../shared/auth/authStore";
import { Navigate } from "react-router-dom";
import { loadPreferences } from "../../shared/theme/themeEngine";

const WorkspaceSelectPage: React.FC = () => {
    const user = authStore.user;
    const [switching, setSwitching] = useState(false);
    const prefs = loadPreferences();
    const isLight = prefs.theme.startsWith("light");

    if (!user) return <Navigate to="/login" replace />;

    const workspaces = user.availableWorkspaces || [];
    const isSuperAdmin = user.isSuperAdmin;

    const handleSelect = async (id: number, redirectUrl: string = "/") => {
        setSwitching(true);
        await authStore.switchWorkspace(id, redirectUrl);
    };

    // ── No workspaces assigned (regular user) ──
    if (workspaces.length === 0 && !isSuperAdmin) {
        return (
            <div className={`min-h-screen flex items-center justify-center p-4 ${isLight ? "bg-slate-50" : "bg-slate-950"}`}>
                <div className="max-w-md w-full text-center space-y-6">
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl border ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-800/80 border-slate-700/50"}`}>
                        🏢
                    </div>
                    <h1 className={`text-2xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>Sin empresas asignadas</h1>
                    <p className={`text-sm leading-relaxed ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Tu cuenta no tiene ninguna empresa asignada. Contactá al administrador.
                    </p>
                    <button
                        onClick={() => authStore.logout()}
                        className={`px-6 py-2.5 text-sm font-medium rounded-xl transition-all border ${isLight ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm" : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700/50"}`}
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        );
    }

    // ── Color palette for company cards ──
    const cardColors = isLight
        ? [
            { bg: "from-indigo-50 to-indigo-100/50", border: "border-indigo-200", icon: "bg-indigo-100 text-indigo-600" },
            { bg: "from-emerald-50 to-emerald-100/50", border: "border-emerald-200", icon: "bg-emerald-100 text-emerald-600" },
            { bg: "from-amber-50 to-amber-100/50", border: "border-amber-200", icon: "bg-amber-100 text-amber-600" },
            { bg: "from-rose-50 to-rose-100/50", border: "border-rose-200", icon: "bg-rose-100 text-rose-600" },
            { bg: "from-cyan-50 to-cyan-100/50", border: "border-cyan-200", icon: "bg-cyan-100 text-cyan-600" },
            { bg: "from-purple-50 to-purple-100/50", border: "border-purple-200", icon: "bg-purple-100 text-purple-600" },
        ]
        : [
            { bg: "from-indigo-500/20 to-violet-500/10", border: "border-indigo-500/30", icon: "bg-indigo-500/20 text-indigo-400" },
            { bg: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30", icon: "bg-emerald-500/20 text-emerald-400" },
            { bg: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/30", icon: "bg-amber-500/20 text-amber-400" },
            { bg: "from-rose-500/20 to-pink-500/10", border: "border-rose-500/30", icon: "bg-rose-500/20 text-rose-400" },
            { bg: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/30", icon: "bg-cyan-500/20 text-cyan-400" },
            { bg: "from-purple-500/20 to-fuchsia-500/10", border: "border-purple-500/30", icon: "bg-purple-500/20 text-purple-400" },
        ];

    // SVG stroke colors based on theme
    const strokeLight = "rgba(99,102,241,0.12)";
    const strokeDark = "rgba(99,102,241,0.06)";
    const stroke = isLight ? strokeLight : strokeDark;
    const strokeAlt = isLight ? "rgba(168,85,247,0.10)" : "rgba(168,85,247,0.05)";
    const strokeAmber = isLight ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.05)";

    return (
        <div className={`min-h-screen flex flex-col overflow-hidden ${isLight ? "bg-slate-50" : "bg-slate-950"}`}>
            {/* Animated floating shapes background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Glow orbs */}
                <div
                    className={`absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl ${isLight ? "bg-indigo-300/10" : "bg-indigo-500/[0.04]"}`}
                    style={{ animation: "wsFloat1 25s ease-in-out infinite" }}
                />
                <div
                    className={`absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl ${isLight ? "bg-violet-300/10" : "bg-violet-500/[0.04]"}`}
                    style={{ animation: "wsFloat2 20s ease-in-out infinite" }}
                />
                <div
                    className={`absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl ${isLight ? "bg-amber-200/10" : "bg-amber-500/[0.03]"}`}
                    style={{ animation: "wsFloat3 30s ease-in-out infinite" }}
                />

                {/* Floating geometric shapes */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15%" cy="20%" r="40" fill="none" stroke={stroke} strokeWidth="1.5" style={{ animation: "wsFloat1 18s ease-in-out infinite" }} />
                    <circle cx="85%" cy="30%" r="25" fill="none" stroke={strokeAlt} strokeWidth="1.5" style={{ animation: "wsFloat2 22s ease-in-out infinite" }} />
                    <circle cx="50%" cy="80%" r="55" fill="none" stroke={stroke} strokeWidth="1" style={{ animation: "wsFloat3 26s ease-in-out infinite" }} />
                    <rect x="75%" y="15%" width="30" height="30" fill="none" stroke={strokeAmber} strokeWidth="1.5" transform="rotate(45, 75, 15)" style={{ animation: "wsFloat2 15s ease-in-out infinite" }} />
                    <rect x="20%" y="65%" width="22" height="22" fill="none" stroke={stroke} strokeWidth="1" transform="rotate(45, 20, 65)" style={{ animation: "wsFloat1 20s ease-in-out infinite" }} />
                    <polygon points="90,85 105,60 120,85" fill="none" stroke={strokeAlt} strokeWidth="1" transform="translate(800,200)" style={{ animation: "wsFloat3 17s ease-in-out infinite" }} />
                    <polygon points="0,20 10,0 20,20" fill="none" stroke={stroke} strokeWidth="1" transform="translate(200,400)" style={{ animation: "wsFloat2 24s ease-in-out infinite" }} />
                </svg>
            </div>

            {/* CSS Keyframe animations */}
            <style>{`
                @keyframes wsFloat1 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(15px, -20px) rotate(3deg); }
                    50% { transform: translate(-10px, -35px) rotate(-2deg); }
                    75% { transform: translate(20px, -15px) rotate(4deg); }
                }
                @keyframes wsFloat2 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(-20px, 15px) rotate(-3deg); }
                    50% { transform: translate(15px, 30px) rotate(2deg); }
                    75% { transform: translate(-10px, 10px) rotate(-4deg); }
                }
                @keyframes wsFloat3 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(25px, -25px) rotate(5deg); }
                    66% { transform: translate(-15px, 20px) rotate(-3deg); }
                }
            `}</style>

            {/* Top bar */}
            <header className={`relative z-10 border-b ${isLight ? "border-slate-200 bg-white/80 backdrop-blur" : "border-slate-800/50"}`}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="CRM F360"
                            className={`w-9 h-9 rounded-xl border ${isLight ? "border-slate-200" : "border-slate-700/50"}`}
                        />
                        <div>
                            <h1 className={`text-sm font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
                                CRM <span style={{ color: prefs.accentColor }}>F360</span>
                            </h1>
                            <p className="text-[10px] text-slate-500">Gestión integral de negocios</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                            {user.fullName}
                        </span>
                        <button
                            onClick={() => authStore.logout()}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${isLight ? "text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border-slate-200" : "text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border-slate-700/50"}`}
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-3xl space-y-8">
                    {/* Heading */}
                    <div className="text-center space-y-3">
                        <div
                            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl border shadow-lg ${isLight ? "bg-white border-slate-200 shadow-slate-200/50" : "bg-slate-800/80 border-slate-700/50"}`}
                        >
                            {isSuperAdmin ? "⚡" : "🏢"}
                        </div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>
                            {isSuperAdmin ? "Panel de Administración" : "Seleccioná tu empresa"}
                        </h2>
                        <p className="text-sm text-slate-500 max-w-md mx-auto">
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
                                className="px-5 py-2.5 text-sm font-semibold rounded-xl border transition-all flex items-center gap-2 shadow-sm"
                                style={{
                                    backgroundColor: prefs.accentColor + "15",
                                    borderColor: prefs.accentColor + "30",
                                    color: prefs.accentColor,
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
                                style={{ borderColor: prefs.accentColor, borderTopColor: "transparent" }}
                            />
                            <p className="text-sm text-slate-500">Ingresando a la empresa…</p>
                        </div>
                    ) : workspaces.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-slate-500">No hay empresas creadas. Usá el panel de administración para crear una.</p>
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
                                        className={`group relative p-6 rounded-2xl bg-gradient-to-br ${color.bg} border ${color.border} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left cursor-pointer ${isLight ? "shadow-sm hover:shadow-md" : ""}`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-10 h-10 rounded-xl ${color.icon} flex items-center justify-center text-lg mb-4`}>
                                            🏢
                                        </div>

                                        {/* Name */}
                                        <h3 className={`text-base font-bold mb-1 ${isLight ? "text-slate-800 group-hover:text-slate-900" : "text-white group-hover:text-white/90"}`}>
                                            {ws.name}
                                        </h3>

                                        <div className="mt-4 flex items-center justify-end">
                                            <span className={`text-xs flex items-center gap-1 transition-colors ${isLight ? "text-slate-400 group-hover:text-slate-600" : "text-slate-500 group-hover:text-slate-400"}`}>
                                                Ingresar →
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className={`relative z-10 border-t ${isLight ? "border-slate-200" : "border-slate-800/50"}`}>
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
