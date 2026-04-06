import React, { useState } from "react";
import type { User } from "./types";
import { useToast } from "../../shared/context/ToastContext";
import UserForm from "./components/UserForm";
import EmptyState from "../../shared/ui/EmptyState";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import { CardsSkeleton } from "../../shared/ui/Skeleton";
import Pagination from "../../shared/ui/Pagination";
import { usePagination } from "../../shared/hooks/usePagination";
import Modal from "../../shared/ui/Modal";
import { useUsersPaged, useCreateUser, useUpdateUser, useDeleteUser } from "../../shared/hooks/useUserQuery";

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
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  const { page, pageSize, search, handleSearch, params, setPage, setPageSize } = usePagination();
  const { data, isLoading: loading } = useUsersPaged(params);
  const filtered = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleNewClick = () => { setEditing(null); setShowForm(true); };

  const handleCreate = async (data: Partial<User>) => {
    await createMutation.mutateAsync(data);
    setShowForm(false);
    addToast("success", "Usuario creado correctamente");
  };

  const handleUpdate = async (data: Partial<User>) => {
    if (!editing) return;
    await updateMutation.mutateAsync({ id: editing.id, data });
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
    await deleteMutation.mutateAsync(id);
    addToast("success", "Usuario eliminado");
  };

  const handleEditClick = (user: User) => { setEditing(user); setShowForm(true); };
  const handleCancelForm = () => { setEditing(null); setShowForm(false); };

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
              {totalCount} {totalCount === 1 ? "usuario" : "usuarios"} del sistema
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
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
          />
        </div>

        <Modal
          open={showForm}
          onClose={handleCancelForm}
          title={editing ? "✏️ Editar usuario" : "👥 Nuevo usuario"}
        >
            <UserForm
              initial={editing ?? {}}
              isEditing={!!editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={handleCancelForm}
            />
        </Modal>

        {/* User Cards Grid */}
        {loading ? (
          <CardsSkeleton count={6} />
        ) : filtered.length === 0 ? (
          search.trim() === "" ? (
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
            {filtered.map((u: User, i: number) => {
              const gradIdx = i % AVATAR_GRADIENTS.length;
              const lastLogin = timeAgo(u.lastLoginAt);
              return (
                <div
                  key={u.id}
                  className="group relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/30 p-4 transition-all hover:bg-slate-800/60 hover:border-slate-700/60"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${AVATAR_GRADIENTS[gradIdx]} ${AVATAR_COLORS[gradIdx].border} border flex items-center justify-center ${AVATAR_COLORS[gradIdx].text} text-sm font-bold shrink-0`}>
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

                  <div className="absolute top-3 right-3 flex items-center gap-1">
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

        {/* Pagination Details */}
        {!loading && totalCount > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onChangePage={setPage}
            onChangePageSize={setPageSize}
          />
        )}
      </div>
      <ConfirmModal {...confirmProps} />
    </>
  );
};

export default UsersPage;
