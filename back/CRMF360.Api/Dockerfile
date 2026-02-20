# ── Build stage ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar archivos de proyecto y restaurar dependencias
COPY CRMF360.Domain/CRMF360.Domain.csproj           CRMF360.Domain/
COPY CRMF360.Application/CRMF360.Application.csproj  CRMF360.Application/
COPY CRMF360.Infrastructure/CRMF360.Infrastructure.csproj CRMF360.Infrastructure/
COPY CRMF360.Api/CRMF360.Api.csproj                  CRMF360.Api/

RUN dotnet restore CRMF360.Api/CRMF360.Api.csproj

# Copiar todo el código fuente y publicar
COPY . .
RUN dotnet publish CRMF360.Api/CRMF360.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Runtime stage ────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "CRMF360.Api.dll"]
