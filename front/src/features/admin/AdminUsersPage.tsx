import React from "react";
import UsersPage from "../users/UsersPage";

/**
 * Global admin users page — wraps the existing UsersPage component.
 * When rendered inside the SuperAdmin layout (no tenantId context),
 * the backend returns ALL users across all companies.
 */
const AdminUsersPage: React.FC = () => {
    return <UsersPage />;
};

export default AdminUsersPage;
