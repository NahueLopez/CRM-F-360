import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const routeTitles: Record<string, string> = {
    "/": "Dashboard",
    "/companies": "Empresas",
    "/projects": "Proyectos",
    "/time-entries": "Carga de horas",
    "/reports": "Reportes",
    "/users": "Usuarios",
    "/profile": "Mi perfil",
};

const DashboardLayout: React.FC = () => {
    const location = useLocation();

    // Match exact routes or fallback for dynamic routes
    const title =
        routeTitles[location.pathname] ??
        (location.pathname.includes("/board") ? "Tablero Kanban" : "Dashboard");

    return (
        <div className="min-h-screen flex bg-slate-900 text-slate-100">
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
