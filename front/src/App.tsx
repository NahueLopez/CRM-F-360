import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ── Shared (always loaded) ──
import ProtectedRoute from "./shared/auth/ProtectedRoute";
import DashboardLayout from "./shared/layout/DashboardLayout";
import { ToastProvider } from "./shared/context/ToastContext";
import { QueryProvider } from "./shared/api/queryProvider";
import { authStore } from "./shared/auth/authStore";
import ErrorBoundary from "./shared/ui/ErrorBoundary";

// ── Feature pages (lazy loaded — each gets its own chunk) ──
const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const CompaniesPage = lazy(() => import("./features/companies/CompaniesPage"));
const ContactsPage = lazy(() => import("./features/contacts/ContactsPage"));
const ProjectsPage = lazy(() => import("./features/projects/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./features/projects/ProjectDetailPage"));
const ProjectActivityPage = lazy(() => import("./features/projects/ProjectActivityPage"));
const TasksPage = lazy(() => import("./features/tasks/TasksPage"));
const KanbanBoardPage = lazy(() => import("./features/kanban/KanbanBoardPage"));
const TimeEntriesPage = lazy(() => import("./features/time-entries/TimeEntriesPage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const CalendarPage = lazy(() => import("./features/calendar/CalendarPage"));
const PipelinePage = lazy(() => import("./features/pipeline/PipelinePage"));
const RemindersPage = lazy(() => import("./features/reminders/RemindersPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const UsersPage = lazy(() => import("./features/users/UsersPage"));
const AuditLogsPage = lazy(() => import("./features/audit/AuditLogsPage"));
const RoomsPage = lazy(() => import("./features/rooms/RoomsPage"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const WorkspaceSelectPage = lazy(() => import("./features/workspaces/WorkspaceSelectPage"));

// ── SuperAdmin pages ──
const SuperAdminLayout = lazy(() => import("./shared/layout/SuperAdminLayout"));
const AdminCompaniesPage = lazy(() => import("./features/admin/AdminCompaniesPage"));
const AdminUsersPage = lazy(() => import("./features/admin/AdminUsersPage"));
const AdminRolesPage = lazy(() => import("./features/admin/AdminRolesPage"));
const AdminSettingsPage = lazy(() => import("./features/admin/AdminSettingsPage"));

// ── Suspense fallback ──
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-500">Cargando…</span>
    </div>
  </div>
);

/** Guard: redirect authenticated users away from /login */
const LoginGuard = () => {
  if (authStore.isAuthenticated) {
    // If user has tenantId → dashboard, else → workspace selection
    if (authStore.user?.tenantId) return <Navigate to="/" replace />;
    return <Navigate to="/select-workspace" replace />;
  }
  return <LoginPage />;
};

/** Guard: only SuperAdmin can access /admin routes */
const SuperAdminGuard = () => {
  if (!authStore.isAuthenticated) return <Navigate to="/login" replace />;
  if (!authStore.user?.isSuperAdmin) return <Navigate to="/" replace />;
  return <SuperAdminLayout />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route
                  path="/login"
                  element={<LoginGuard />}
                />

                {/* Workspace Selection (no sidebar) */}
                <Route
                  path="/select-workspace"
                  element={
                    authStore.isAuthenticated
                      ? <WorkspaceSelectPage />
                      : <Navigate to="/login" replace />
                  }
                />

                {/* SuperAdmin Panel (→ /admin) */}
                <Route element={<SuperAdminGuard />}>
                  <Route path="admin" element={<AdminCompaniesPage />} />
                  <Route path="admin/users" element={<AdminUsersPage />} />
                  <Route path="admin/roles" element={<AdminRolesPage />} />
                  <Route path="admin/settings" element={<AdminSettingsPage />} />
                </Route>

                {/* Protected */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="companies" element={<CompaniesPage />} />
                    <Route path="contacts" element={<ContactsPage />} />
                    <Route path="projects" element={<ProjectsPage />} />
                    <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="projects/:projectId/board" element={<KanbanBoardPage />} />
                    <Route path="projects/:projectId/activity" element={<ProjectActivityPage />} />
                    <Route path="time-entries" element={<TimeEntriesPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="pipeline" element={<PipelinePage />} />
                    <Route path="reminders" element={<RemindersPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="rooms" element={<RoomsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* Admin only or restricted by permissions */}
                <Route element={<ProtectedRoute requiredPermissions={["users.view"]} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="users" element={<UsersPage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute requiredPermissions={["audit.view"]} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="audit-logs" element={<AuditLogsPage />} />
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
