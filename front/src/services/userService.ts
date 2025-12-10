import { User } from "../types/user";
import { getApiBaseV1 } from "./api";
import { authStore } from "../auth/authStore";

const API = `${getApiBaseV1()}/Users`;

type ErrorResponse = {
  message?: string;
};

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await fetch(API, {
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
    });

    if (!res.ok) {
      throw new Error("No se pudieron cargar los usuarios.");
    }

    return res.json();
  },

  async create(data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<User> {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let msg = "Error al crear el usuario.";
      try {
        const err = (await res.json()) as ErrorResponse;
        if (err.message) msg = err.message;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    return res.json();
  },

  async update(
    id: number,
    data: {
      fullName: string;
      email: string;
      phone?: string;
      active: boolean;
    }
  ): Promise<User> {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let msg = "Error al actualizar el usuario.";
      try {
        const err = (await res.json()) as ErrorResponse;
        if (err.message) msg = err.message;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    return res.json();
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        ...authStore.getAuthHeader(),
      },
    });

    if (!res.ok) {
      let msg = "Error al eliminar el usuario.";
      try {
        const err = (await res.json()) as ErrorResponse;
        if (err.message) msg = err.message;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }
  },
};
