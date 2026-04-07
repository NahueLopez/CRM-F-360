import { api } from "../api/apiClient";
import { applyPreferences } from "../theme/themeEngine";
import { DEFAULT_PREFERENCES } from "../../features/settings/preferencesService";

export interface AuthUser {
  id: number;
  tenantId: number;
  tenantName: string;
  fullName: string;
  email: string;
  phone?: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions: string[];
  availableWorkspaces: { id: number; name: string }[];
}

interface LoginResponse {
  id: number;
  tenantId: number;
  tenantName: string;
  fullName: string;
  email: string;
  phone?: string;
  token: string;
  refreshToken: string;
  isSuperAdmin: boolean;
  roles: string[];
  preferences?: string;
  permissions: string[];
  availableWorkspaces: { id: number; name: string }[];
}

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";
const REFRESH_TOKEN_KEY = "refresh_token";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

class AuthStore {
  user: AuthUser | null = loadUser();

  get isAuthenticated(): boolean {
    return this.user !== null && !!localStorage.getItem(AUTH_TOKEN_KEY);
  }

  get token(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  hasRole(role: string): boolean {
    return this.user?.roles.includes(role) ?? false;
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some((r) => this.user?.roles.includes(r));
  }

  hasPermission(permission: string): boolean {
    if (this.user?.isSuperAdmin) return true;
    if (this.hasRole("Admin")) return true;
    return this.user?.permissions?.includes(permission) ?? false;
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      this._setSession(res);
      return true;
    } catch {
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const res = await api.get<LoginResponse>("/auth/me");
      this._setSession(res);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  async switchWorkspace(tenantId: number, redirectUrl: string = "/"): Promise<boolean> {
    try {
      const res = await api.post<LoginResponse>("/auth/switch-workspace", { tenantId });
      this._setSession(res);
      // Reload UI cleanly so the entire app query cache picks up the new TenantId via endpoints automatically
      window.location.replace(redirectUrl);
      return true;
    } catch {
      return false;
    }
  }

  /** Exit current workspace and return to the admin panel / workspace selection */
  exitWorkspace() {
    if (!this.user) return;
    // Clear tenantId from user state → ProtectedRoute will redirect to /select-workspace
    this.user = { ...this.user, tenantId: 0 as any, tenantName: "" };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user));
    window.location.replace("/select-workspace");
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await api.put<void>("/auth/change-password", { currentPassword, newPassword });
      return true;
    } catch {
      return false;
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.location.href = "/login";
  }

  private _setSession(res: LoginResponse) {
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);

    this.user = {
      id: res.id,
      tenantId: res.tenantId,
      tenantName: res.tenantName,
      fullName: res.fullName,
      email: res.email,
      phone: res.phone,
      isSuperAdmin: res.isSuperAdmin || false,
      roles: res.roles,
      permissions: res.permissions ?? [],
      availableWorkspaces: res.availableWorkspaces || [],
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user));

    // Only overwrite theme if the API actually returned preferences.
    // Otherwise, keep whatever is already in localStorage (user's saved prefs).
    if (res.preferences) {
      try {
        const prefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(res.preferences) };
        applyPreferences(prefs);
      } catch {
        applyPreferences();  // fallback → reads from localStorage
      }
    } else {
      // No preferences in API response → re-apply from localStorage (don't reset)
      applyPreferences();
    }
  }
}

export const authStore = new AuthStore();
