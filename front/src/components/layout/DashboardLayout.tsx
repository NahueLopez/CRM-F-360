import { Outlet, useLocation } from "react-router-dom";
import Sidebar, { SidebarProvider } from "./Sidebar";
import Topbar from "./Topbar";
import ChatWidget from "../chat/ChatWidget";

const routeTitles: Record<string, string> = {
    "/": "Dashboard",
    "/companies": "Empresas",
    "/contacts": "Contactos",
    "/projects": "Proyectos",
    "/tasks": "Tareas",
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
        <SidebarProvider>
            <div className="min-h-screen flex bg-slate-900 text-slate-100 dark:bg-slate-900 dark:text-slate-100 light:bg-slate-50 light:text-slate-900">
                <Sidebar />

                <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                    <Topbar title={title} />
                    <section className="flex-1 p-4 sm:p-6 overflow-auto">
                        <div key={location.pathname} className="animate-page-in">
                            <Outlet />
                        </div>
                    </section>
                </main>
            </div>
            <ChatWidget />
        </SidebarProvider>
    );
};

export default DashboardLayout;
