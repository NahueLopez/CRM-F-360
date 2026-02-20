# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Instalar dependencias primero (cache layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Copiar configuración de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
