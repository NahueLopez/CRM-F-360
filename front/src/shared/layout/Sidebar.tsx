import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { authStore } from "../auth/authStore";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  /** The .view permission required — if null, always visible */
  permission: string | null;
}

export const allItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "📊", permission: null },
  { to: "/companies", label: "Empresas", icon: "🏢", permission: "companies.view" },
  { to: "/contacts", label: "Contactos", icon: "👤", permission: "contacts.view" },
  { to: "/projects", label: "Proyectos", icon: "📁", permission: "projects.view" },
  { to: "/tasks", label: "Tareas", icon: "✅", permission: "tasks.view" },
  { to: "/pipeline", label: "Pipeline", icon: "💰", permission: "deals.view" },
  { to: "/calendar", label: "Calendario", icon: "📅", permission: "calendar.view" },
  { to: "/time-entries", label: "Carga de horas", icon: "⏱", permission: "timeentries.view" },
  { to: "/reminders", label: "Recordatorios", icon: "⏰", permission: "reminders.view" },
  { to: "/reports", label: "Reportes", icon: "📈", permission: "reports.view" },
  { to: "/users", label: "Usuarios", icon: "👥", permission: "users.view" },
  { to: "/audit-logs", label: "Auditoría", icon: "📋", permission: "audit.view" },
  { to: "/rooms", label: "Salas", icon: "🚪", permission: "rooms.view" },
  { to: "/settings", label: "Preferencias", icon: "⚙️", permission: null },
];

/* ── Mobile sidebar context ── */
interface SidebarContextType {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}
const SidebarContext = createContext<SidebarContextType>({
  mobileOpen: false,
  setMobileOpen: () => { },
});
export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

/* ── NavMenu: nav with always-visible scroll arrows ── */
const NavMenu: React.FC<{ items: NavItem[] }> = ({ items }) => {
  const ref = useRef<HTMLElement>(null);

  const arrowBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    padding: "4px 0",
    color: "#64748b",
    cursor: "pointer",
    background: "none",
    border: "none",
    fontSize: 12,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Up arrow */}
      <button
        onClick={() => ref.current?.scrollBy({ top: -120, behavior: "smooth" })}
        style={arrowBtn}
        tabIndex={-1}
        aria-label="Scroll up"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      <nav
        ref={ref}
        className="flex-1 px-3 space-y-0.5 text-sm overflow-y-auto hide-scroll"
        role="navigation"
        aria-label="Menú principal"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isActive
                ? "bg-indigo-500/10 text-white font-medium"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              }`
            }
            aria-current={undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
                )}
                <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Down arrow */}
      <button
        onClick={() => ref.current?.scrollBy({ top: 120, behavior: "smooth" })}
        style={arrowBtn}
        tabIndex={-1}
        aria-label="Scroll down"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mobileOpen, setMobileOpen } = useSidebar();

  const items = allItems.filter(
    (item) => {
      // SuperAdmin-only items
      if (item.permission === "__superadmin__") return authStore.user?.isSuperAdmin ?? false;
      // Items with no permission: always visible
      if (item.permission === null) return true;
      // Permission-based items
      return authStore.hasPermission(item.permission);
    },
  );

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const handleLogout = () => {
    authStore.logout();
    navigate("/login");
  };

  const initials =
    authStore.user?.fullName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "??";

  // ... Inside header:
  const header = (
    <div className="p-4 border-b border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CRM F360 Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <h1 className="text-xl font-bold tracking-tight">
            CRM <span className="text-indigo-400">F360</span>
          </h1>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white text-xl p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>
      <WorkspaceSwitcher />
    </div>
  );

  const footer = authStore.user && (
    <div className="p-4 border-t border-slate-800">
      <button
        onClick={() => navigate("/profile")}
        className="flex items-center gap-3 w-full text-left group mb-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Ver perfil de usuario"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <span className="text-xs font-medium text-slate-300 group-hover:text-white transition block truncate">
            {authStore.user.fullName}
          </span>
          <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 transition block">
            Ver perfil →
          </span>
        </div>
      </button>
      <button
        onClick={handleLogout}
        className="text-xs text-slate-500 hover:text-red-400 transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label="Cerrar sesión"
      >
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-64 bg-slate-950 border-r border-slate-800 flex-col shrink-0 sticky top-0 h-screen overflow-hidden"
        aria-label="Barra lateral"
      >
        {header}
        <NavMenu items={items} />
        {footer}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 flex flex-col 
                    transform transition-transform duration-300 ease-in-out lg:hidden
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {header}
        <NavMenu items={items} />
        {footer}
      </aside>
    </>
  );
};

export default Sidebar;
