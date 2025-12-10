import React, { useEffect, useState } from "react";
import { Company } from "../../types/company";
import { companyService } from "../../services/companyService";
import CompanyForm from "../../components/companies/CompanyForm";
import CompaniesTable from "../../components/companies/CompaniesTable";
import ConfirmDialog from "../../components/common/ConfirmDialog";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // 👇 para el modal de confirmación
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const companyToDelete = companies.find((c) => c.id === deleteId) ?? null;

  const showSuccess = (message: string) => {
    setFeedback({ type: "success", message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const showError = (message: string) => {
    setFeedback({ type: "error", message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (err) {
      console.error("No se pudo cargar empresas", err);
      showError("No se pudieron cargar las empresas.");
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

  const handleCreate = async (data: Partial<Company>) => {
    try {
      const newCompany = await companyService.create(data);
      setCompanies((prev) => [...prev, newCompany]);
      setShowForm(false);
      showSuccess("Empresa creada correctamente.");
    } catch (err) {
      console.error("Error al crear empresa", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la empresa.";
      showError(msg);
    }
  };

  const handleUpdate = async (data: Partial<Company>) => {
    if (!editing) return;

    try {
      const updated = await companyService.update(editing.id, data);

      setCompanies((prev) =>
        prev.map((c) => (c.id === editing.id ? updated : c))
      );

      setEditing(null);
      setShowForm(false);
      showSuccess("Empresa actualizada correctamente.");
    } catch (err) {
      console.error("Error al actualizar empresa", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar la empresa.";
      showError(msg);
    }
  };

  // 👉 ahora esto SOLO abre el modal
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  // 👉 esta es la que realmente borra cuando el usuario confirma
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await companyService.remove(deleteId);
      setCompanies((prev) => prev.filter((c) => c.id !== deleteId));
      showSuccess("Empresa eliminada correctamente.");
    } catch (err) {
      console.error("Error al eliminar empresa", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar la empresa.";
      showError(msg);
    } finally {
      setDeleteId(null);
    }
  };

  const handleEditClick = (company: Company) => {
    setEditing(company);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de feedback */}
      {feedback && (
        <div
          className={`
            text-sm px-4 py-2 rounded-lg border
            ${
              feedback.type === "success"
                ? "bg-emerald-900/40 border-emerald-600 text-emerald-200"
                : "bg-red-900/40 border-red-600 text-red-200"
            }
          `}
        >
          {feedback.message}
        </div>
      )}

      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Empresas</h3>
          <p className="text-sm text-slate-400">
            Gestioná las empresas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewClick}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-indigo-600 text-sm font-medium"
        >
          + Nueva empresa
        </button>
      </div>

      {/* Panel desplegable de formulario */}
      {showForm && (
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <h4 className="text-lg font-semibold mb-3">
            {editing ? "Editar empresa" : "Crear nueva empresa"}
          </h4>

          <CompanyForm
            initial={editing ?? {}}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="text-sm text-slate-400">Cargando empresas...</div>
      )}

      {/* Tabla o estado vacío */}
      {!loading && companies.length === 0 && !showForm && (
        <p className="text-sm text-slate-500">
          No hay empresas cargadas aún. Creá la primera con el botón{" "}
          <span className="font-semibold">"Nueva empresa"</span>.
        </p>
      )}

      {companies.length > 0 && (
        <CompaniesTable
          data={companies}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick} // 👈 ahora abre modal
        />
      )}

      {/* Modal de confirmación de borrado */}
      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar empresa"
        description={
          companyToDelete
            ? `¿Seguro que querés eliminar "${companyToDelete.razonSocial}"?`
            : "¿Seguro que querés eliminar esta empresa?"
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default CompaniesPage;
