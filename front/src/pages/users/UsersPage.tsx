import React, { useEffect, useState } from "react";
import { User } from "../../types/user";
import { userService } from "../../services/userService";
import UserForm from "../../components/users/UserForm";
import UsersTable from "../../components/users/UsersTable";

type Feedback =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const showSuccess = (message: string) => {
    setFeedback({ type: "success", message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const showError = (message: string) => {
    setFeedback({ type: "error", message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error("Error cargando usuarios", err);
      showError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNewClick = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleCreate = async (data: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  }) => {
    try {
      const newUser = await userService.create(data);
      setUsers((prev) => [...prev, newUser]);
      setShowForm(false);
      showSuccess("Usuario creado correctamente.");
    } catch (err) {
      console.error("Error al crear usuario", err);
      showError(
        err instanceof Error ? err.message : "Ocurrió un error al crear el usuario."
      );
    }
  };

  const handleUpdate = async (data: {
    fullName: string;
    email: string;
    phone?: string;
    active: boolean;
  }) => {
    if (!editing) return;

    try {
      const updated = await userService.update(editing.id, data);
      setUsers((prev) =>
        prev.map((u) => (u.id === editing.id ? updated : u))
      );
      setEditing(null);
      setShowForm(false);
      showSuccess("Usuario actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar usuario", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar el usuario."
      );
    }
  };

  const handleDelete = async (id: number) => {
    const user = users.find((u) => u.id === id);

    const confirmed = window.confirm(
      `¿Seguro que querés eliminar al usuario "${
        user?.fullName ?? ""
      }"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await userService.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showSuccess("Usuario eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar usuario", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar el usuario."
      );
    }
  };

  const handleEditClick = (user: User) => {
    setEditing(user);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div
          className={`text-sm px-4 py-2 rounded-lg border ${
            feedback.type === "success"
              ? "bg-emerald-900/40 border-emerald-600 text-emerald-200"
              : "bg-red-900/40 border-red-600 text-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Usuarios</h3>
          <p className="text-sm text-slate-400">
            Gestioná los usuarios internos que van a cargar horas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewClick}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-indigo-600 text-sm font-medium"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <h4 className="text-lg font-semibold mb-3">
            {editing ? "Editar usuario" : "Crear nuevo usuario"}
          </h4>

          <UserForm
            initial={editing ?? {}}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {loading && (
        <div className="text-sm text-slate-400">Cargando usuarios...</div>
      )}

      {/* Tabla */}
      <UsersTable data={users} onEdit={handleEditClick} onDelete={handleDelete} />
    </div>
  );
};

export default UsersPage;
