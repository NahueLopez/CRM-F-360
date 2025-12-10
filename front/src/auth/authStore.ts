import type { CurrentUser, UserRole } from "../types/user";
import { getApiBaseV1 } from "../services/api";

type LoginResponse = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  token: string;
  roles?: string[]; 
};

function mapRole(roles?: string[]): UserRole {
  if (!roles || roles.length === 0) {
    return "Member"; 
  }

  if (roles.includes("Admin")) return "Admin";
  if (roles.includes("Manager")) return "Manager";
  return "Member";
}

class AuthStore {
  user: CurrentUser | null = null;
  token: string | null = null;

  constructor() {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");

    if (savedToken && savedUser) {
      this.token = savedToken;
      this.user = JSON.parse(savedUser) as CurrentUser;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBaseV1()}/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        console.error("Login failed, status:", res.status);
        return false;
      }

      const data = (await res.json()) as LoginResponse;

      this.token = data.token;
      this.user = {
        id: data.id,
        name: data.fullName,
        email: data.email,
        role: mapRole(data.roles), 
      };

      localStorage.setItem("auth_token", this.token);
      localStorage.setItem("auth_user", JSON.stringify(this.user));

      return true;
    } catch (err) {
      console.error("Error en login", err);
      return false;
    }
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  }

  getAuthHeader(): Record<string, string> {
    if (!this.token) return {};
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

export const authStore = new AuthStore();
