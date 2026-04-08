import React, { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authStore } from "../auth/authStore";
import { loadPreferences, applyPreferences } from "../theme/themeEngine";


const adminNavItems = [
    { to: "/admin", label: "Empresas", icon: "🏢", end: true },
    { to: "/admin/users", label: "Usuarios", icon: "👥", end: false },
    { to: "/admin/roles", label: "Roles y Permisos", icon: "🔐", end: false },
    { to: "/admin/settings", label: "Preferencias", icon: "⚙️", end: false },
];

const SuperAdminLayout: React.FC = () => {
    const user = authStore.user;
    const location = useLocation();
    const navigate = useNavigate();
    const [prefs, setPrefs] = React.useState(loadPreferences());
    const isLight = prefs.theme.startsWith("light");
    
    // UI states
    const [isExiting, setIsExiting] = React.useState(false);
    const [profileOpen, setProfileOpen] = React.useState(false);
    const profileDropdownRef = React.useRef<HTMLDivElement>(null);

    // Profile dropdown click outside hook
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleReturnToMain = () => {
        setIsExiting(true);
        setTimeout(() => {
            navigate("/select-workspace");
        }, 350); // Matches CSS transition duration
    };
    
    // Apply preferences on mount
    useEffect(() => {
        applyPreferences(prefs);
        const handlePreferencesUpdated = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                setPrefs(customEvent.detail);
            } else {
                setPrefs(loadPreferences());
            }
        };
        window.addEventListener("preferences-updated", handlePreferencesUpdated);
        return () => window.removeEventListener("preferences-updated", handlePreferencesUpdated);
    }, []);
    return (
        <div className={`flex h-screen relative bg-transparent ${isLight ? "text-slate-800" : "text-slate-200"}`}>

            {/* Sidebar — fixed height, internal scroll */}
            <aside className={`w-64 border-r flex flex-col shrink-0 h-screen sticky top-0 z-10 animate-sidebar-in ${isLight ? "border-slate-200 bg-white/80 backdrop-blur-md" : "border-slate-800 bg-slate-950/80 backdrop-blur-md"}`}>
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
                            <span className="text-base transition-transform group-hover:scale-110">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer — return to main panel */}
                <div className={`p-4 border-t shrink-0 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                    <button
                        onClick={handleReturnToMain}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isLight ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-slate-800/60"}`}
                    >
                        ↩ Volver al panel principal
                    </button>
                </div>
            </aside>

            {/* Main content — includes Topbar and Page Area */}
            <div className="flex-1 flex flex-col min-w-0 z-10 relative h-screen">
                
                {/* Modern SuperAdmin Topbar */}
                <header className={`h-[72px] shrink-0 border-b flex items-center justify-between px-6 lg:px-8 transition-all duration-300 backdrop-blur-md relative z-30 ${isLight ? "bg-white/80 border-slate-200" : "bg-slate-950/80 border-slate-800/80"}`}
                        style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid' }}>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <h2 className={`text-lg font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>Centro de Control</h2>
                            <p className={`text-xs font-medium ${isLight ? "text-slate-500" : "text-slate-500"}`}>Configuración y administración global</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Profile Dropdown Trigger */}
                        <div className="relative" ref={profileDropdownRef}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className={`flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1.5 rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${
                                    profileOpen ? (isLight ? "bg-slate-50 border-slate-300 shadow-sm" : "bg-slate-800 border-slate-600 shadow-sm") : (isLight ? "bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200" : "bg-slate-900/40 hover:bg-slate-800 border-slate-800/50 hover:border-slate-700")
                                }`}
                            >
                                <div className="text-right hidden md:block">
                                    <p className={`text-sm font-bold leading-tight ${isLight ? "text-slate-700" : "text-slate-200"}`}>{user?.fullName}</p>
                                    <p className={`text-[10px] uppercase tracking-wider font-bold mt-0.5 ${isLight ? "text-slate-400" : "text-slate-500"}`}>{user?.roles?.[0]}</p>
                                </div>
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shadow-md transition-transform duration-200 hover:scale-105"
                                    style={{ background: `linear-gradient(135deg, ${prefs.accentColor}, ${prefs.accentColor}cc)` }}
                                >
                                    {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
                                </div>
                            </button>

                            {/* Rich Profile Popover */}
                            {profileOpen && (
                                <div className={`absolute top-full right-0 mt-3 w-80 rounded-3xl border shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ${isLight ? "bg-white border-slate-200 shadow-slate-200/50" : "bg-slate-900 border-slate-700 shadow-black/80"}`}>
                                    {/* Hero Header */}
                                    <div className="h-24 relative border-b border-slate-700/20" 
                                        style={{ background: `linear-gradient(135deg, ${prefs.accentColor}40, ${prefs.accentColor}11)` }}>
                                        <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[2px]" />
                                    </div>
                                    <div className="px-6 pb-6 relative -mt-12">
                                        {/* Avatar */}
                                        <div className={`w-20 h-20 mx-auto rounded-2xl border-4 shadow-xl flex items-center justify-center text-4xl font-extrabold mb-3 bg-slate-800`}
                                            style={{ borderColor: isLight ? "#ffffff" : "#0f172a", color: prefs.accentColor }}>
                                            {user?.fullName?.charAt(0)?.toUpperCase()}
                                        </div>
                                        {/* Info */}
                                        <div className="text-center mb-6">
                                            <h3 className={`text-xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>{user?.fullName}</h3>
                                            <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: prefs.accentColor }}>{user?.roles?.[0]}</p>
                                            <p className={`text-xs mt-1.5 font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>{user?.email}</p>
                                        </div>
                                        {/* Actions */}
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => { setProfileOpen(false); navigate("/admin/profile"); }}
                                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border ${isLight ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:border-slate-600"} active:scale-[0.98]`}
                                            >
                                                <span>👤</span> Ver perfil
                                            </button>
                                            <button
                                                onClick={() => authStore.logout()}
                                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${isLight ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"} active:scale-[0.98]`}
                                            >
                                                <span>Cerrar sesión</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className={`flex-1 overflow-y-auto relative transition-all duration-350 ease-in-out ${isExiting ? "opacity-0 scale-[0.98] translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}>
                    <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-layout-in">
                        <div key={location.pathname} className="animate-page-in">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
