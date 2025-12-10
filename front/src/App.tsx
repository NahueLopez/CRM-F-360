import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Layout from "./components/layout/Layout";
import CompaniesPage from "./pages/companies/CompaniesPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import TimeEntriesPage from "./pages/time-entries/TimeEntriesPage";
import ReportsPage from "./pages/reports/ReportsPage";
import UsersPage from "./pages/users/UsersPage";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import { authStore } from "./auth/authStore";
import PersonasEmpresaPage from "./pages/personas-empresa/PersonasEmpresaPage";

function PrivateRoute({ children }: { children: JSX.Element }) {
  if (!authStore.user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const LoginRoute: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LoginPage
      onLogin={() => {
        // después de loguear, vamos al home
        navigate("/", { replace: true });
      }}
    />
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login público */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Todo lo demás va dentro de Layout y es privado */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Home */}
          <Route index element={<HomePage />} />

          {/* Rutas del menú */}
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="personas-empresa" element={<PersonasEmpresaPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="time-entries" element={<TimeEntriesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        {/* Cualquier otra ruta desconocida redirige al home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
