import { Navigate, Outlet } from "react-router-dom";
import { authStore } from "./authStore";

interface ProtectedRouteProps {
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles, requiredPermissions }) => {
  if (!authStore.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.some((r) => authStore.hasRole(r))) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermissions && !requiredPermissions.some((p) => authStore.hasPermission(p))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
