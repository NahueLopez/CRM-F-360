import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { authStore } from "../../auth/authStore";

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  const pathToKey = (path: string): string => {
    if (path.startsWith("/companies")) return "companies";
    if (path.startsWith("/personas-empresa")) return "personas-empresa";
    if (path.startsWith("/projects")) return "projects";
    if (path.startsWith("/time-entries")) return "time-entries";
    if (path.startsWith("/reports")) return "reports";
    if (path.startsWith("/users")) return "users";
    return "dashboard"; 
  };

  const keyToPath = (key: string): string => {
    switch (key) {
      case "companies":
        return "/companies";
      case "personas-empresa":
        return "/personas-empresa";
      case "projects":
        return "/projects";
      case "time-entries":
        return "/time-entries";
      case "reports":
        return "/reports";
      case "users":
        return "/users";
      case "dashboard":
      default:
        return "/";
    }
  };

  const current = pathToKey(path);

  const handleNavigate = (key: string) => {
    const dest = keyToPath(key);
    navigate(dest);
  };

  const handleLogout = () => {
    authStore.logout();
    navigate("/login", { replace: true });
  };

  const getTitle = () => {
    switch (current) {
      case "companies":
        return "Empresas";
      case "projects":
        return "Proyectos";
      case "time-entries":
        return "Carga de horas";
      case "reports":
        return "Reportes";
      case "users":
        return "Usuarios";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* 👇 Sidebar sigue recibiendo las mismas props que antes */}
      <Sidebar current={current} onNavigate={handleNavigate} />

      <main className="flex-1 flex flex-col">
        <Topbar title={getTitle()} onLogout={handleLogout} />

        <section className="flex-1 p-6">
          {/* 👇 Acá se montan HomePage, CompaniesPage, etc. según las rutas */}
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default Layout;
