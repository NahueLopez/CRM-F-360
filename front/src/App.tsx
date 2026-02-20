import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ── Shared ──
import ProtectedRoute from "./shared/auth/ProtectedRoute";
import DashboardLayout from "./shared/layout/DashboardLayout";
import { ThemeProvider } from "./shared/context/ThemeContext";
import { ToastProvider } from "./shared/context/ToastContext";
import { authStore } from "./shared/auth/authStore";

// ── Feature pages (lazy-loadable in the future) ──
import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import CompaniesPage from "./features/companies/CompaniesPage";
import ContactsPage from "./features/contacts/ContactsPage";
import ProjectsPage from "./features/projects/ProjectsPage";
import TasksPage from "./features/tasks/TasksPage";
import KanbanBoardPage from "./features/kanban/KanbanBoardPage";
import TimeEntriesPage from "./features/time-entries/TimeEntriesPage";
import ReportsPage from "./features/reports/ReportsPage";
import CalendarPage from "./features/calendar/CalendarPage";
import PipelinePage from "./features/pipeline/PipelinePage";
import RemindersPage from "./features/reminders/RemindersPage";
import ProfilePage from "./features/profile/ProfilePage";
import UsersPage from "./features/users/UsersPage";
import AuditLogsPage from "./features/audit/AuditLogsPage";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
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
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route
                  path="projects/:projectId/board"
                  element={<KanbanBoardPage />}
                />
                <Route path="time-entries" element={<TimeEntriesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="reminders" element={<RemindersPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute requiredRoles={["Admin"]} />}>
              <Route element={<DashboardLayout />}>
                <Route path="users" element={<UsersPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
