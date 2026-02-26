import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ── Shared (always loaded) ──
import ProtectedRoute from "./shared/auth/ProtectedRoute";
import DashboardLayout from "./shared/layout/DashboardLayout";
import { ThemeProvider } from "./shared/context/ThemeContext";
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

// ── Suspense fallback ──
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-500">Cargando…</span>
    </div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
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
                      <Route path="projects/:projectId" element={<ProjectDetailPage />} />
                      <Route path="tasks" element={<TasksPage />} />
                      <Route
                        path="projects/:projectId/board"
                        element={<KanbanBoardPage />}
                      />
                      <Route
                        path="projects/:projectId/activity"
                        element={<ProjectActivityPage />}
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
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
