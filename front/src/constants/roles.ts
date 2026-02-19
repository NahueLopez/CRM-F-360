/** Centralized role constants — avoid magic strings everywhere. */
export const ROLES = {
    Admin: "Admin",
    Manager: "Manager",
    User: "User",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
