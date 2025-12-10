export function getApiBaseV1(): string {
  const base = import.meta.env.VITE_BASE_URL_API_V1;
  if (!base) {
    throw new Error("Falta VITE_BASE_URL_API_V1 en el .env");
  }
  return base.replace(/\/+$/, "");
}
