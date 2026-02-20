import React, { useEffect, useState } from "react";
import type { User } from "./types";
import { userService } from "./userService";
import UserForm from "./components/UserForm";
import UsersTable from "./components/UsersTable";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    load();
  }, []);

  const handleNewClick = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleCreate = async (data: Partial<User>) => {
    const newUser = await userService.create(data);
    setUsers((prev) => [...prev, newUser]);
    setShowForm(false);
  };

  const handleUpdate = async (data: Partial<User>) => {
    if (!editing) return;
    const updated = await userService.update(editing.id, data);
    setUsers((prev) =>
      prev.map((u) => (u.id === editing.id ? updated : u))
    );
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que querés borrar este usuario?")) return;
    await userService.remove(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
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
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition"
        >
          + Nuevo usuario
        </button>
      </div>

      {/* Panel formulario */}
      {showForm && (
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <h4 className="text-lg font-semibold mb-3">
            {editing ? "Editar usuario" : "Crear nuevo usuario"}
          </h4>

          <UserForm
            initial={editing ?? {}}
            isEditing={!!editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {loading && (
        <div className="text-sm text-slate-400">Cargando usuarios...</div>
      )}

      {/* Tabla */}
      <UsersTable
        data={users}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default UsersPage;
