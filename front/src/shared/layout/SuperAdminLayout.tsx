import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { authStore } from "../auth/authStore";
import { loadPreferences } from "../theme/themeEngine";

const adminNavItems = [
    { to: "/admin", label: "Empresas", icon: "🏢", end: true },
    { to: "/admin/users", label: "Usuarios", icon: "👥", end: false },
    { to: "/admin/roles", label: "Roles y Permisos", icon: "🔐", end: false },
    { to: "/admin/settings", label: "Preferencias", icon: "⚙️", end: false },
];

const SuperAdminLayout: React.FC = () => {
    const user = authStore.user;
    const prefs = loadPreferences();
    const isLight = prefs.theme.startsWith("light");

    return (
        <div className={`flex h-screen ${isLight ? "bg-slate-50 text-slate-800" : "bg-slate-950 text-slate-200"}`}>
            {/* Sidebar — fixed height, internal scroll */}
            <aside className={`w-64 border-r flex flex-col shrink-0 h-screen sticky top-0 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-950"}`}>
                {/* Header */}
                <div className={`p-5 border-b shrink-0 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${prefs.accentColor}, ${prefs.accentColor}dd)` }}
                        >
                            ⚡
                        </div>
                        <div>
                            <h1 className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>Panel SuperAdmin</h1>
                            <p className="text-[11px] text-slate-500">Administración global</p>
                        </div>
                    </div>
                </div>

                {/* Navigation — scrolls if items overflow */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {adminNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? isLight
                                            ? "text-slate-800 border shadow-sm"
                                            : "text-white border"
                                        : isLight
                                            ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                }`
                            }
                            style={({ isActive }) =>
                                isActive
                                    ? {
                                        backgroundColor: prefs.accentColor + "15",
                                        borderColor: prefs.accentColor + "30",
                                        color: prefs.accentColor,
                                    }
                                    : {}
                            }
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer — always pinned to bottom */}
                <div className={`p-4 border-t space-y-2 shrink-0 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                    <button
                        onClick={() => {
                            window.location.replace("/select-workspace");
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isLight ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}
                    >
                        ↩ Volver al panel principal
                    </button>

                    <div className="flex items-center gap-2 px-3 py-2">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-white font-medium"
                            style={{ backgroundColor: prefs.accentColor }}
                        >
                            {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${isLight ? "text-slate-700" : "text-slate-300"}`}>{user?.fullName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => authStore.logout()}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-all text-left"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* Main content — scrolls independently */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SuperAdminLayout;
