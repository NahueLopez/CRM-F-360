import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import CompaniesPage from "./pages/companies/CompaniesPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import KanbanBoardPage from "./pages/kanban/KanbanBoardPage";
import TimeEntriesPage from "./pages/time-entries/TimeEntriesPage";
import ReportsPage from "./pages/reports/ReportsPage";
import UsersPage from "./pages/users/UsersPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { authStore } from "./auth/authStore";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            authStore.isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route
              path="projects/:projectId/board"
              element={<KanbanBoardPage />}
            />
            <Route path="time-entries" element={<TimeEntriesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute requiredRoles={["Admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
