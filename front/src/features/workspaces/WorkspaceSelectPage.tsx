import React, { useState, useMemo } from "react";
import { authStore } from "../../shared/auth/authStore";
import { Navigate } from "react-router-dom";
import { loadPreferences } from "../../shared/theme/themeEngine";

/** Convert hex to RGB components */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 99, g: 102, b: 241 }; // fallback indigo
}

const WorkspaceSelectPage: React.FC = () => {
    const user = authStore.user;
    const [switching, setSwitching] = useState(false);
    const prefs = loadPreferences();
    const isLight = prefs.theme.startsWith("light");
    const accent = prefs.accentColor;
    const rgb = useMemo(() => hexToRgb(accent), [accent]);

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
            <div className={`min-h-screen flex items-center justify-center p-4 ${isLight ? "bg-white" : "bg-slate-950"}`}>
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

    // Accent-derived colors for SVG shapes
    const accentOpacity = isLight ? 0.15 : 0.08;
    const accentFill = `rgba(${rgb.r},${rgb.g},${rgb.b},${isLight ? 0.04 : 0.02})`;
    const accentStroke = `rgba(${rgb.r},${rgb.g},${rgb.b},${accentOpacity})`;
    const accentStrokeMed = `rgba(${rgb.r},${rgb.g},${rgb.b},${accentOpacity * 0.7})`;
    const accentGlow = `rgba(${rgb.r},${rgb.g},${rgb.b},${isLight ? 0.08 : 0.05})`;

    return (
        <div className={`min-h-screen flex flex-col overflow-hidden relative ${isLight ? "bg-white" : "bg-slate-950"}`}>

            {/* ═══════════════ ANIMATED BACKGROUND ═══════════════ */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {/* Large accent glow orbs */}
                <div
                    className="absolute rounded-full blur-[100px]"
                    style={{
                        width: 500, height: 500,
                        top: "10%", left: "-5%",
                        background: `radial-gradient(circle, ${accentGlow}, transparent 70%)`,
                        animation: "wsOrb1 20s ease-in-out infinite",
                    }}
                />
                <div
                    className="absolute rounded-full blur-[80px]"
                    style={{
                        width: 400, height: 400,
                        bottom: "5%", right: "-3%",
                        background: `radial-gradient(circle, rgba(${rgb.r},${rgb.g},${rgb.b},${isLight ? 0.06 : 0.04}), transparent 70%)`,
                        animation: "wsOrb2 25s ease-in-out infinite",
                    }}
                />
                <div
                    className="absolute rounded-full blur-[60px]"
                    style={{
                        width: 300, height: 300,
                        top: "50%", left: "60%",
                        background: `radial-gradient(circle, rgba(${rgb.r},${rgb.g},${rgb.b},${isLight ? 0.05 : 0.03}), transparent 70%)`,
                        animation: "wsOrb3 30s ease-in-out infinite",
                    }}
                />

                {/* SVG geometric shapes — accent color based */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    {/* Large rotating ring */}
                    <circle cx="12%" cy="25%" r="60" fill={accentFill} stroke={accentStroke} strokeWidth="2" style={{ animation: "wsShape1 22s ease-in-out infinite" }} />
                    <circle cx="88%" cy="35%" r="35" fill="none" stroke={accentStrokeMed} strokeWidth="1.5" strokeDasharray="6,4" style={{ animation: "wsShape2 18s ease-in-out infinite" }} />
                    <circle cx="45%" cy="85%" r="75" fill="none" stroke={accentStroke} strokeWidth="1" style={{ animation: "wsShape3 28s ease-in-out infinite" }} />
                    <circle cx="70%" cy="15%" r="20" fill={accentFill} stroke={accentStrokeMed} strokeWidth="1" style={{ animation: "wsShape1 14s ease-in-out infinite" }} />

                    {/* Diamonds */}
                    <g style={{ animation: "wsShape2 16s ease-in-out infinite" }}>
                        <rect x="80" y="500" width="35" height="35" rx="4" fill={accentFill} stroke={accentStroke} strokeWidth="1.5" transform="rotate(45, 97.5, 517.5)" />
                    </g>
                    <g style={{ animation: "wsShape3 20s ease-in-out infinite" }}>
                        <rect x="1100" y="150" width="25" height="25" rx="3" fill="none" stroke={accentStrokeMed} strokeWidth="1.5" transform="rotate(45, 1112.5, 162.5)" />
                    </g>

                    {/* Triangles */}
                    <polygon points="200,100 220,65 240,100" fill={accentFill} stroke={accentStroke} strokeWidth="1.5" style={{ animation: "wsShape1 24s ease-in-out infinite" }} />
                    <polygon points="900,450 915,425 930,450" fill="none" stroke={accentStrokeMed} strokeWidth="1" style={{ animation: "wsShape2 19s ease-in-out infinite" }} />

                    {/* Small floating dots */}
                    <circle cx="30%" cy="45%" r="4" fill={accentStroke} style={{ animation: "wsDot1 8s ease-in-out infinite" }} />
                    <circle cx="65%" cy="55%" r="3" fill={accentStrokeMed} style={{ animation: "wsDot2 10s ease-in-out infinite" }} />
                    <circle cx="20%" cy="80%" r="3.5" fill={accentStroke} style={{ animation: "wsDot1 12s ease-in-out infinite" }} />
                    <circle cx="80%" cy="70%" r="2.5" fill={accentStrokeMed} style={{ animation: "wsDot2 9s ease-in-out infinite" }} />
                    <circle cx="55%" cy="20%" r="3" fill={accentStroke} style={{ animation: "wsDot1 11s ease-in-out infinite" }} />

                    {/* Connecting lines */}
                    <line x1="15%" y1="30%" x2="35%" y2="50%" stroke={accentStrokeMed} strokeWidth="0.5" strokeDasharray="8,6" style={{ animation: "wsShape3 20s ease-in-out infinite" }} />
                    <line x1="70%" y1="20%" x2="85%" y2="40%" stroke={accentStrokeMed} strokeWidth="0.5" strokeDasharray="8,6" style={{ animation: "wsShape1 25s ease-in-out infinite" }} />
                </svg>
            </div>

            {/* CSS Keyframe animations */}
            <style>{`
                @keyframes wsOrb1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(40px, -30px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                }
                @keyframes wsOrb2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-35px, 25px) scale(1.05); }
                    66% { transform: translate(30px, -15px) scale(0.9); }
                }
                @keyframes wsOrb3 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-50px, -30px) scale(1.15); }
                }
                @keyframes wsShape1 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(20px, -25px) rotate(8deg); }
                    50% { transform: translate(-15px, -40px) rotate(-5deg); }
                    75% { transform: translate(25px, -15px) rotate(10deg); }
                }
                @keyframes wsShape2 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    25% { transform: translate(-25px, 20px) rotate(-8deg); }
                    50% { transform: translate(20px, 35px) rotate(5deg); }
                    75% { transform: translate(-15px, 12px) rotate(-10deg); }
                }
                @keyframes wsShape3 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(30px, -30px) rotate(12deg); }
                    66% { transform: translate(-20px, 25px) rotate(-6deg); }
                }
                @keyframes wsDot1 {
                    0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                    50% { transform: translate(10px, -15px); opacity: 1; }
                }
                @keyframes wsDot2 {
                    0%, 100% { transform: translate(0, 0); opacity: 0.5; }
                    50% { transform: translate(-12px, 10px); opacity: 0.9; }
                }
            `}</style>

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
