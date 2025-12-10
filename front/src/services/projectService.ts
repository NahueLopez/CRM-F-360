import { Project } from "../types/project";
import { getApiBaseV1 } from "./api";
import { authStore } from "../auth/authStore";

const API = `${getApiBaseV1()}/Proyectos`;

export const projectService = {
  async getAll(): Promise<Project[]> {
    const res = await fetch(API, {
      headers: {
        ...authStore.getAuthHeader(),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "No se pudieron cargar los proyectos.");
    }

    return res.json();
  },

  async create(data: Partial<Project>): Promise<Project> {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();       // 👈 leemos el mensaje del back
      throw new Error(
        text || "Ocurrió un error al crear el proyecto."
      );
    }

    return res.json();
  },

  async update(id: number, data: Partial<Project>): Promise<Project> {
    const payload = { ...data, id };

    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authStore.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 204) {
      // el back no devuelve body → devolvemos algo coherente
      return { ...(data as Project), id };
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        text || "Ocurrió un error al actualizar el proyecto."
      );
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
      const text = await res.text();
      throw new Error(text || "Ocurrió un error al eliminar el proyecto.");
    }
  },
};
