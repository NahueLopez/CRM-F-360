import React from "react";
import { authStore } from "../../auth/authStore";

interface SidebarProps {
  current: string;
  onNavigate: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ current, onNavigate }) => {
  const role = authStore.user?.role ?? "Member";

  const allItems = [
    { id: "dashboard",    label: "Dashboard",      roles: ["Admin", "Manager", "Member"] },
    { id: "companies",    label: "Empresas",       roles: ["Admin", "Manager"] },
    { id: "personas-empresa", label: "Contactos de empresa",   roles: ["Admin", "Manager"] },
    { id: "projects",     label: "Proyectos",      roles: ["Admin", "Manager"] },
    { id: "time-entries", label: "Carga de horas", roles: ["Admin", "Manager", "Member"] },
    { id: "reports",      label: "Reportes",       roles: ["Admin", "Manager"] },
    { id: "users",        label: "Usuarios",       roles: ["Admin"] },
  ];

  const items = allItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">
          Mini CRM <span className="text-primary">F360</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Empresas, proyectos y horas.
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 text-sm">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition
              ${
                current === item.id
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-900"
              }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {authStore.user && (
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Sesión:
          <span className="font-medium"> {authStore.user.name}</span>
          <span className="ml-1 text-slate-400">
            ({authStore.user.role})
          </span>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
