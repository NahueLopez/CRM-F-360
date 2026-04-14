import { useEffect, useState, useMemo } from "react";
import { permissionsApi, rolesApi } from "./rolesService";
import type { Permission, RoleWithPermissions } from "./rolesService";
import { useToast } from "../../shared/context/ToastContext";
import { useConfirm } from "../../shared/ui/useConfirm";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useIsLight } from "../../shared/hooks/useIsLight";

// ── Module display config ──
const MODULE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  Companies: { label: "Empresas", icon: "🏢", color: "#6366f1" },
  Contacts: { label: "Contactos", icon: "👤", color: "#8b5cf6" },
  Deals: { label: "Negocios", icon: "💰", color: "#f59e0b" },
  Projects: { label: "Proyectos", icon: "📁", color: "#3b82f6" },
  Tasks: { label: "Tareas", icon: "✅", color: "#10b981" },
  Users: { label: "Usuarios", icon: "👥", color: "#ef4444" },
  Reports: { label: "Reportes", icon: "📈", color: "#ec4899" },
  Calendar: { label: "Calendario", icon: "📅", color: "#14b8a6" },
  Rooms: { label: "Salas", icon: "🚪", color: "#f97316" },
  Reminders: { label: "Recordatorios", icon: "⏰", color: "#a855f7" },
  TimeEntries: { label: "Carga de horas", icon: "⏱", color: "#06b6d4" },
  Audit: { label: "Auditoría", icon: "📋", color: "#64748b" },
  Roles: { label: "Roles", icon: "🔐", color: "#e11d48" },
};

const ACTION_LABELS: Record<string, string> = {
  view: "👁 Ver",
  create: "➕ Crear",
  edit: "✏️ Editar",
  delete: "🗑 Eliminar",
  move: "↔️ Mover",
  export: "📤 Exportar",
  reserve: "📌 Reservar",
  manage: "⚙️ Gestionar",
};

const PROTECTED_ROLES = ["Admin", "Manager", "User"];

const RolesPermissionsPage = () => {
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();
  const isLight = useIsLight();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);

  // Load data
  useEffect(() => {
    Promise.all([permissionsApi.getAll(), rolesApi.getAll()]).then(([perms, rls]) => {
      setPermissions(perms);
      setRoles(rls);
      if (rls.length > 0) setSelectedRoleId(rls[0].id);
      setLoading(false);
    });
  }, []);

  // Selected role
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;

  // Group permissions by module
  const modules = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of permissions) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module)!.push(p);
    }
    return Array.from(map.entries());
  }, [permissions]);

  // Permission count for a role in a module
  const getModuleStats = (role: RoleWithPermissions, modulePerms: Permission[]) => {
    const total = modulePerms.length;
    const active = modulePerms.filter((p) => role.permissions.includes(p.name)).length;
    return { total, active, allChecked: active === total, noneChecked: active === 0 };
  };

  // Toggle a permission
  const togglePermission = (permName: string) => {
    if (!selectedRoleId) return;
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRoleId) return r;
        const has = r.permissions.includes(permName);
        return {
          ...r,
          permissions: has
            ? r.permissions.filter((p) => p !== permName)
            : [...r.permissions, permName],
        };
      }),
    );
  };

  // Toggle all in a module
  const toggleModule = (modulePerms: Permission[]) => {
    if (!selectedRoleId) return;
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRoleId) return r;
        const names = modulePerms.map((p) => p.name);
        const allChecked = names.every((n) => r.permissions.includes(n));
        return {
          ...r,
          permissions: allChecked
            ? r.permissions.filter((p) => !names.includes(p))
            : [...new Set([...r.permissions, ...names])],
        };
      }),
    );
  };

  // Save
  const saveRole = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const permIds = permissions
        .filter((p) => selectedRole.permissions.includes(p.name))
        .map((p) => p.id);
      await rolesApi.update(selectedRole.id, { name: selectedRole.name, permissionIds: permIds });
      addToast("success", `Permisos de "${selectedRole.name}" guardados`);
    } catch {
      addToast("error", "Error al guardar permisos");
    } finally {
      setSaving(false);
    }
  };

  // Create
  const handleCreate = async () => {
    if (!newRoleName.trim()) return;
    setCreating(true);
    try {
      const created = await rolesApi.create(newRoleName.trim());
      setRoles((prev) => [...prev, created]);
      setSelectedRoleId(created.id);
      setNewRoleName("");
      setShowNewRole(false);
      addToast("success", `Rol "${created.name}" creado`);
    } catch {
      addToast("error", "Error al crear rol");
    } finally {
      setCreating(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedRole || PROTECTED_ROLES.includes(selectedRole.name)) return;
    const ok = await confirm({
      message: `¿Eliminar el rol "${selectedRole.name}"? Los usuarios con este rol perderán acceso.`,
      title: "Eliminar rol",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await rolesApi.delete(selectedRole.id);
      setRoles((prev) => prev.filter((r) => r.id !== selectedRole.id));
      setSelectedRoleId(roles.find((r) => r.id !== selectedRole.id)?.id || null);
      addToast("success", `Rol "${selectedRole.name}" eliminado`);
    } catch {
      addToast("error", "Error al eliminar rol");
    }
  };

  // Permission count for selected role
  const totalPerms = permissions.length;
  const activePerms = selectedRole
    ? permissions.filter((p) => selectedRole.permissions.includes(p.name)).length
    : 0;

  // ── Theme-aware classes ──
  const cardCls = isLight
    ? "bg-white border-slate-200 shadow-sm"
    : "bg-slate-800/25 border-slate-700/30";
  const cardHoverCls = isLight
    ? "hover:border-slate-300"
    : "hover:border-slate-600/40";
  const headingCls = isLight ? "text-slate-800" : "text-white";
  const subCls = isLight ? "text-slate-500" : "text-slate-500";
  const borderSubtle = isLight ? "border-slate-100" : "border-slate-700/20";

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold tracking-tight ${headingCls}`}>Roles y Permisos</h2>
        <p className={`text-sm mt-1 ${subCls}`}>
          Seleccioná un rol y configurá qué puede hacer en cada módulo
        </p>
      </div>

      {/* Role tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {roles.map((role) => {
          const isSelected = role.id === selectedRoleId;
          const permCount = permissions.filter((p) => role.permissions.includes(p.name)).length;
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`group relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : isLight
                    ? "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 shadow-sm"
                    : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-slate-700/30"
              }`}
            >
              <span>{role.name}</span>
              <span
                className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : isLight
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-700/50 text-slate-500"
                }`}
              >
                {permCount}/{totalPerms}
              </span>
            </button>
          );
        })}

        {/* New role button */}
        {showNewRole ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowNewRole(false);
                  setNewRoleName("");
                }
              }}
              placeholder="Nombre del rol..."
              className={`px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40 ${
                isLight
                  ? "bg-white border-indigo-300 text-slate-800 placeholder:text-slate-400"
                  : "bg-slate-800/60 border-indigo-500/50 text-white placeholder:text-slate-600"
              }`}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newRoleName.trim()}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {creating ? "..." : "✓"}
            </button>
            <button
              onClick={() => {
                setShowNewRole(false);
                setNewRoleName("");
              }}
              className={`px-3 py-2 rounded-xl text-xs transition ${
                isLight
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
              }`}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewRole(true)}
            className={`px-4 py-2.5 rounded-xl border-2 border-dashed text-sm transition-all ${
              isLight
                ? "border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500"
                : "border-slate-700/50 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400"
            }`}
          >
            + Nuevo rol
          </button>
        )}
      </div>

      {/* Selected role panel */}
      {selectedRole && (
        <>
          {/* Role info bar */}
          <div className={`flex items-center justify-between border rounded-xl px-4 py-3 ${cardCls}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">
                  {selectedRole.name.charAt(0)}
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${headingCls}`}>{selectedRole.name}</h3>
                  <p className={`text-[11px] ${subCls}`}>
                    {activePerms} de {totalPerms} permisos activos
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className={`w-32 h-1.5 rounded-full overflow-hidden ${isLight ? "bg-slate-200" : "bg-slate-700/50"}`}>
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${totalPerms ? (activePerms / totalPerms) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!PROTECTED_ROLES.includes(selectedRole.name) && (
                <button
                  onClick={handleDelete}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    isLight
                      ? "text-red-400 hover:text-red-500 hover:bg-red-50"
                      : "text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                >
                  🗑 Eliminar rol
                </button>
              )}
              <button
                onClick={saveRole}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "💾 Guardar cambios"
                )}
              </button>
            </div>
          </div>

          {/* Module cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {modules.map(([module, modulePerms]) => {
              const config = MODULE_CONFIG[module] || {
                label: module,
                icon: "📦",
                color: "#6366f1",
              };
              const stats = getModuleStats(selectedRole, modulePerms);

              return (
                <div
                  key={module}
                  className={`border rounded-xl overflow-hidden transition-colors ${cardCls} ${cardHoverCls}`}
                >
                  {/* Module header */}
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b ${borderSubtle}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{config.icon}</span>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${
                        isLight ? "text-slate-600" : "text-slate-300"
                      }`}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          stats.allChecked
                            ? "bg-emerald-500/20 text-emerald-400"
                            : stats.noneChecked
                              ? isLight
                                ? "bg-slate-100 text-slate-400"
                                : "bg-slate-700/50 text-slate-500"
                              : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {stats.active}/{stats.total}
                      </span>
                      <button
                        onClick={() => toggleModule(modulePerms)}
                        className={`w-5 h-5 rounded-md border-2 transition-all inline-flex items-center justify-center text-[10px] ${
                          stats.allChecked
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : stats.noneChecked
                              ? isLight
                                ? "border-slate-300 hover:border-slate-400"
                                : "border-slate-600 hover:border-slate-500"
                              : "bg-emerald-500/30 border-emerald-500/60 text-white"
                        }`}
                        title={stats.allChecked ? "Desmarcar todo" : "Marcar todo"}
                      >
                        {stats.allChecked ? "✓" : stats.noneChecked ? "" : "−"}
                      </button>
                    </div>
                  </div>

                  {/* Permission toggles */}
                  <div className="px-3 py-2 space-y-0.5">
                    {modulePerms.map((perm) => {
                      const action = perm.name.split(".")[1] || perm.name;
                      const isActive = selectedRole.permissions.includes(perm.name);
                      return (
                        <button
                          key={perm.id}
                          onClick={() => togglePermission(perm.name)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            isActive
                              ? isLight
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-emerald-500/10 text-emerald-300"
                              : isLight
                                ? "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                : "text-slate-500 hover:bg-slate-700/30 hover:text-slate-400"
                          }`}
                        >
                          <span>{ACTION_LABELS[action] || action}</span>
                          <div
                            className={`w-8 h-4 rounded-full relative transition-all ${
                              isActive
                                ? "bg-emerald-500"
                                : isLight
                                  ? "bg-slate-200"
                                  : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${
                                isActive ? "left-[18px]" : "left-0.5"
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmModal {...confirmProps} />
    </div>
  );
};

const PageSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="space-y-2">
      <div className="skeleton h-7 w-48 rounded-lg" />
      <div className="skeleton h-4 w-72 rounded-lg" />
    </div>
    <div className="flex gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton h-10 w-28 rounded-xl" />
      ))}
    </div>
    <div className="skeleton h-14 w-full rounded-xl" />
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="skeleton h-40 rounded-xl" />
      ))}
    </div>
  </div>
);

export default RolesPermissionsPage;
