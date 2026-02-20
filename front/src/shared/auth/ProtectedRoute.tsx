import { Navigate, Outlet } from "react-router-dom";
import { authStore } from "./authStore";

interface ProtectedRouteProps {
    requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles }) => {
    if (!authStore.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRoles && !requiredRoles.some((r) => authStore.hasRole(r))) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
