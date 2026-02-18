import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authStore } from "../../auth/authStore";

interface NavItem {
  to: string;
  label: string;
  roles: string[];
}

const allItems: NavItem[] = [
  { to: "/", label: "Dashboard", roles: ["Admin", "Manager", "User"] },
  { to: "/companies", label: "Empresas", roles: ["Admin", "Manager"] },
  { to: "/projects", label: "Proyectos", roles: ["Admin", "Manager"] },
  { to: "/time-entries", label: "Carga de horas", roles: ["Admin", "Manager", "User"] },
  { to: "/reports", label: "Reportes", roles: ["Admin", "Manager"] },
  { to: "/users", label: "Usuarios", roles: ["Admin"] },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const userRoles = authStore.user?.roles ?? [];

  const items = allItems.filter((item) =>
    item.roles.some((r) => userRoles.includes(r))
  );

  const handleLogout = () => {
    authStore.logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">
          CRM <span className="text-indigo-400">F360</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Empresas, proyectos y horas.
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 text-sm">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 rounded-lg transition ${isActive
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-900"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {authStore.user && (
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => navigate("/profile")}
            className="block w-full text-left mb-2 group"
          >
            <span className="text-xs font-medium text-slate-300 group-hover:text-white transition">
              {authStore.user.fullName}
            </span>
            <span className="block text-[10px] text-slate-500 group-hover:text-indigo-400 transition">
              Ver perfil →
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-300 transition"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
