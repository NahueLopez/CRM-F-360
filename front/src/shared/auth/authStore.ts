import { api } from "../api/apiClient";

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  roles: string[];
}

interface LoginResponse {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  token: string;
  refreshToken: string;
  roles: string[];
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
  }

  private _setSession(res: LoginResponse) {
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);

    this.user = {
      id: res.id,
      fullName: res.fullName,
      email: res.email,
      phone: res.phone,
      roles: res.roles,
    };

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user));
  }
}

export const authStore = new AuthStore();
