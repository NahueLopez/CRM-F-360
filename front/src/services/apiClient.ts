import axios from "axios";
import { authStore } from "../auth/authStore";
import { getApiBaseV1 } from "./api";

const api = axios.create({
  baseURL: getApiBaseV1(), // mismo que usabas con fetch
  // withCredentials: true, // solo si usás cookies
});

// ✅ Request interceptor: agrega el token si existe
api.interceptors.request.use((config) => {
  const authHeader = authStore.getAuthHeader(); // { Authorization: 'Bearer ...' } o {}

  config.headers = {
    ...config.headers,
    ...authHeader,
  };

  return config;
});

// ✅ Response interceptor: si el back responde 401, hacemos logout y mandamos al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token inválido o vencido
      authStore.logout();
      // redirigimos al login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
