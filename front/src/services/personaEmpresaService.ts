import type { PersonaEmpresa } from "../types/personaEmpresa";
import { authStore } from "../auth/authStore";
import { getApiBaseV1 } from "./api";

const API = `${getApiBaseV1()}/PersonasEmpresa`;

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    // si es 204 NoContent no hay body
    if (res.status === 204) {
      return null as T;
    }
    return res.json();
  }

  // intento leer mensaje del back
  let message = "Ocurrió un error en el servidor.";
  try {
    const text = await res.text();
    if (text) {
      message = text;
    }
  } catch {
    // ignore
  }

  throw new Error(message);
}

export const personaEmpresaService = {
  async getAll(): Promise<PersonaEmpresa[]> {
    const res = await fetch(API, {
      headers: {
        ...authStore.getAuthHeader(),
      },
    });

    return handleResponse<PersonaEmpresa[]>(res);
  },

  async getByEmpresa(empresaId: number): Promise<PersonaEmpresa[]> {
    const res = await fetch(`${API}/by-empresa/${empresaId}`, {
      headers: {
        ...authStore.getAuthHeader(),
      },
    });

    return handleResponse<PersonaEmpresa[]>(res);
  },

  async create(data: Partial<PersonaEmpresa>): Promise<PersonaEmpresa> {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<PersonaEmpresa>(res);
  },

  async update(id: number, data: Partial<PersonaEmpresa>): Promise<void> {
    const payload = { ...data, id };

    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    await handleResponse<void>(res);
  },

  async softDelete(id: number): Promise<void> {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        ...authStore.getAuthHeader(),
      },
    });

    await handleResponse<void>(res);
  },
};
