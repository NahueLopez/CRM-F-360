import { api } from "../api/apiClient";
import { applyPreferences } from "../theme/themeEngine";
import type { UserPreferences } from "../../features/settings/preferencesService";
import { DEFAULT_PREFERENCES } from "../../features/settings/preferencesService";

export interface AuthUser {
  id: number;
  tenantId: number;
  tenantName: string;
  fullName: string;
  email: string;
  phone?: string;
  roles: string[];
  permissions: string[];
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
  roles: string[];
  preferences?: string;
  permissions: string[];
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
    // Admin bypasses all permission checks
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

  /** Refresh user data + token from the server */
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

  /** Change password for current user */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      await api.put<void>("/auth/change-password", {
        currentPassword,
        newPassword,
      });
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
      roles: res.roles,
      permissions: res.permissions ?? [],
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user));

    // Apply theme preferences
    let prefs: UserPreferences = DEFAULT_PREFERENCES;
    if (res.preferences) {
      try { prefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(res.preferences) }; } catch { }
    }
    applyPreferences(prefs);
  }
}

export const authStore = new AuthStore();
