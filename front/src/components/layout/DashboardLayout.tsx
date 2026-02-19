import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const routeTitles: Record<string, string> = {
    "/": "Dashboard",
    "/companies": "Empresas",
    "/contacts": "Contactos",
    "/projects": "Proyectos",
    "/time-entries": "Carga de horas",
    "/reports": "Reportes",
    "/users": "Usuarios",
    "/profile": "Mi perfil",
    "/calendar": "Calendario",
    "/pipeline": "Pipeline de Ventas",
    "/reminders": "Recordatorios",
    "/audit-logs": "Auditoría",
};

const DashboardLayout: React.FC = () => {
    const location = useLocation();

    const title =
        routeTitles[location.pathname] ??
        (location.pathname.includes("/board") ? "Tablero Kanban" : "Dashboard");

    return (
        <div className="min-h-screen flex bg-slate-900 text-slate-100 dark:bg-slate-900 dark:text-slate-100 light:bg-slate-50 light:text-slate-900">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">
                <Topbar title={title} />
                <section className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </section>
            </main>
        </div>
    );
};

export default DashboardLayout;
