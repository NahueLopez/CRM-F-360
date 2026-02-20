import React, { useEffect, useState } from "react";
import type { User } from "./types";
import { userService } from "./userService";
import { useToast } from "../../shared/context/ToastContext";
import UserForm from "./components/UserForm";
import EmptyState from "../../shared/ui/EmptyState";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { CardsSkeleton } from "../../shared/ui/Skeleton";

const AVATAR_GRADIENTS = [
  "from-violet-500/20 to-purple-500/20",
  "from-sky-500/20 to-cyan-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-amber-500/20 to-orange-500/20",
  "from-rose-500/20 to-pink-500/20",
  "from-indigo-500/20 to-blue-500/20",
];
const AVATAR_COLORS = [
  { text: "text-violet-400", border: "border-violet-500/20" },
  { text: "text-sky-400", border: "border-sky-500/20" },
  { text: "text-emerald-400", border: "border-emerald-500/20" },
  { text: "text-amber-400", border: "border-amber-500/20" },
  { text: "text-rose-400", border: "border-rose-500/20" },
  { text: "text-indigo-400", border: "border-indigo-500/20" },
];

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  const load = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error("Error cargando usuarios", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleNewClick = () => { setEditing(null); setShowForm(true); };

  const handleCreate = async (data: Partial<User>) => {
    const newUser = await userService.create(data);
    setUsers((prev) => [...prev, newUser]);
    setShowForm(false);
    addToast("success", "Usuario creado correctamente");
  };

  const handleUpdate = async (data: Partial<User>) => {
    if (!editing) return;
    const updated = await userService.update(editing.id, data);
    setUsers((prev) => prev.map((u) => (u.id === editing.id ? updated : u)));
    setEditing(null);
    setShowForm(false);
    addToast("success", "Usuario actualizado");
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Eliminar usuario",
      message: "Se eliminará este usuario del sistema. ¿Continuar?",
      confirmLabel: "Sí, eliminar",
      variant: "danger",
    });
    if (!ok) return;
    await userService.remove(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addToast("success", "Usuario eliminado");
  };

  const handleEditClick = (user: User) => { setEditing(user); setShowForm(true); };
  const handleCancelForm = () => { setEditing(null); setShowForm(false); };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.phone ?? "").toLowerCase().includes(q);
  });

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 30) return `Hace ${days}d`;
    return `Hace ${Math.floor(days / 30)}m`;
  };

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Usuarios</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {filtered.length} {filtered.length === 1 ? "usuario" : "usuarios"} del sistema
            </p>
          </div>

          <button
            type="button"
            onClick={handleNewClick}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all shadow-sm shadow-indigo-500/20 active:scale-[0.97]"
          >
            + Nuevo usuario
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
          />
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="border border-slate-700/50 rounded-xl p-5 bg-slate-800/30 animate-page-in">
            <h4 className="text-sm font-semibold mb-4">
              {editing ? "✏️ Editar usuario" : "👥 Nuevo usuario"}
            </h4>
            <UserForm
              initial={editing ?? {}}
              isEditing={!!editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={handleCancelForm}
            />
          </div>
        )}

        {/* User Cards Grid */}
        {loading ? (
          <CardsSkeleton count={6} />
        ) : filtered.length === 0 ? (
          users.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Sin usuarios"
              description="Agregá usuarios al sistema para que puedan cargar horas y gestionar proyectos."
              actionLabel="+ Nuevo usuario"
              onAction={handleNewClick}
            />
          ) : (
            <EmptyState
              icon="🔍"
              title="Sin resultados"
              description="No se encontraron usuarios con esos filtros."
            />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((u, i) => {
              const gradIdx = i % AVATAR_GRADIENTS.length;
              const lastLogin = timeAgo(u.lastLoginAt);
              return (
                <div
                  key={u.id}
                  className="group relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 transition-all hover:bg-slate-800/60 hover:border-slate-700/60"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[gradIdx]} ${AVATAR_COLORS[gradIdx].border} border flex items-center justify-center ${AVATAR_COLORS[gradIdx].text} text-sm font-bold shrink-0`}>
                      {getInitials(u.fullName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200 truncate">{u.fullName}</p>
                        {u.active !== false ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Activo" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" title="Inactivo" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {u.phone && (
                          <span className="text-[11px] text-slate-500 tabular-nums">📞 {u.phone}</span>
                        )}
                        {lastLogin && (
                          <span className="text-[11px] text-slate-600">
                            Último login: {lastLogin}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ghost actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="px-2 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 transition-all"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="px-2 py-1 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmModal {...confirmProps} />
    </>
  );
};

export default UsersPage;
