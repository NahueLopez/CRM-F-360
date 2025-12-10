import { Company } from "../types/company";
import { authStore } from "../auth/authStore";
import { getApiBaseV1 } from "./api";

const API = `${getApiBaseV1()}/Empresas`;

// 👇 función genérica para procesar respuestas del back
async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) {
      return undefined as T;
    }

    const text = await res.text();
    if (!text) {
      return undefined as T;
    }

    // si es JSON, lo parseamos
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      return JSON.parse(text) as T;
    }

    // si es texto plano y ok, no suele pasar pero por si acaso
    return text as unknown as T;
  }

  // ⚠️ manejar error
  let message = "Ocurrió un error en el servidor.";

  try {
    const text = await res.text();

    // 👉 si es texto plano (como tu Conflict con "Ya existe...")
    if (text && !text.trim().startsWith("{")) {
      message = text;
      throw new Error(message);
    }

    // si es JSON, intentamos sacar título/detalle
    const json = JSON.parse(text);
    if (json?.title) message = json.title;
    if (json?.detail) message = json.detail;
    if (json?.message) message = json.message;
  } catch {
    // si algo falla, dejamos el message por defecto
  }

  throw new Error(message);
}

export const companyService = {
  async getAll(): Promise<Company[]> {
    const res = await fetch(API, {
      headers: {
        ...authStore.getAuthHeader(),
      },
    });

    return handleResponse<Company[]>(res);
  },

  async create(data: Partial<Company>): Promise<Company> {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse<Company>(res);
  },

  async update(id: number, data: Partial<Company>): Promise<Company> {
    const payload = { ...data, id };

    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    return handleResponse<Company>(res);
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: {
        ...authStore.getAuthHeader(),
      },
    });

    await handleResponse<void>(res);
  },
};
