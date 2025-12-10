import React, { useEffect, useMemo, useState } from "react";
import type { PersonaEmpresa } from "../../types/personaEmpresa";
import type { Company } from "../../types/company";
import { personaEmpresaService } from "../../services/personaEmpresaService";
import { companyService } from "../../services/companyService";
import PersonaEmpresaForm from "../../components/personas-empresa/PersonaEmpresaForm";
import PersonasEmpresaTable from "../../components/personas-empresa/PersonasEmpresaTable";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const PersonasEmpresaPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(
    null
  );
  const [personas, setPersonas] = useState<PersonaEmpresa[]>([]);
  const [editing, setEditing] = useState<PersonaEmpresa | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const empresaSeleccionada = useMemo(
    () => companies.find((c) => c.id === selectedEmpresaId) ?? null,
    [companies, selectedEmpresaId]
  );

  const showSuccess = (message: string) => {
    setFeedback({ type: "success", message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const showError = (message: string) => {
    setFeedback({ type: "error", message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadEmpresas = async () => {
    try {
      setLoadingEmpresas(true);
      const data = await companyService.getAll();
      setCompanies(data);

      if (data.length > 0 && !selectedEmpresaId) {
        setSelectedEmpresaId(data[0].id);
      }
    } catch (err) {
      console.error("Error cargando empresas", err);
      showError("No se pudieron cargar las empresas.");
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const loadPersonas = async (empresaId: number) => {
    try {
      setLoadingPersonas(true);
      const data = await personaEmpresaService.getByEmpresa(empresaId);
      setPersonas(data);
    } catch (err) {
      console.error("Error cargando contactos", err);
      showError("No se pudieron cargar los contactos de la empresa.");
    } finally {
      setLoadingPersonas(false);
    }
  };

  useEffect(() => {
    loadEmpresas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEmpresaId != null) {
      loadPersonas(selectedEmpresaId);
    } else {
      setPersonas([]);
    }
  }, [selectedEmpresaId]);

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedEmpresaId(value ? Number(value) : null);
    setShowForm(false);
    setEditing(null);
  };

  const handleNewClick = () => {
    if (!selectedEmpresaId) {
      alert("Primero seleccioná una empresa.");
      return;
    }
    setEditing(null);
    setShowForm(true);
  };

  const handleCreate = async (data: Partial<PersonaEmpresa>) => {
    if (!selectedEmpresaId) return;

    try {
      const created = await personaEmpresaService.create({
        ...data,
        empresaId: selectedEmpresaId,
      });

      setPersonas((prev) => [...prev, created]);
      setShowForm(false);
      setEditing(null);
      showSuccess("Contacto creado correctamente.");
    } catch (err) {
      console.error("Error al crear contacto", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el contacto."
      );
    }
  };

  const handleUpdate = async (data: Partial<PersonaEmpresa>) => {
    if (!editing) return;

    try {
      await personaEmpresaService.update(editing.id, {
        ...editing,
        ...data,
      });

      setPersonas((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...data } : p))
      );

      setShowForm(false);
      setEditing(null);
      showSuccess("Contacto actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar contacto", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar el contacto."
      );
    }
  };

  const handleDeleteRequest = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      await personaEmpresaService.softDelete(confirmDeleteId);
      setPersonas((prev) =>
        prev.filter((p) => p.id !== confirmDeleteId)
      );
      showSuccess("Contacto eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar contacto", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar el contacto."
      );
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleEditClick = (persona: PersonaEmpresa) => {
    setEditing(persona);
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">Personas de contacto</h3>
          <p className="text-sm text-slate-400">
            Administrá las personas de contacto de cada empresa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedEmpresaId ?? ""}
            onChange={handleEmpresaChange}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            disabled={loadingEmpresas || companies.length === 0}
          >
            <option value="">Seleccionar empresa</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razonSocial ?? c.nombreFantasia ?? `Empresa #${c.id}`}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNewClick}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-indigo-600 text-sm font-medium"
            disabled={!selectedEmpresaId}
          >
            + Nueva persona
          </button>
        </div>
      </div>

      {companies.length === 0 && !loadingEmpresas && (
        <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-700 rounded-lg px-3 py-2">
          Para gestionar contactos primero necesitás crear al menos una empresa.
        </div>
      )}

      {/* Formulario */}
      {showForm && empresaSeleccionada && (
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <h4 className="text-lg font-semibold mb-3">
            {editing ? "Editar persona de contacto" : "Crear nueva persona"}
          </h4>

          <PersonaEmpresaForm
            initial={editing ?? {}}
            empresa={empresaSeleccionada}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Estado de carga contactos */}
      {loadingPersonas && (
        <div className="text-sm text-slate-400">
          Cargando personas de contacto...
        </div>
      )}

      {/* Tabla */}
      {selectedEmpresaId && !loadingPersonas && (
        <PersonasEmpresaTable
          data={personas}
          onEdit={handleEditClick}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Modal de confirmación de borrado */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h4 className="text-lg font-semibold mb-2">
              Eliminar contacto
            </h4>
            <p className="text-sm text-slate-300 mb-4">
              ¿Estás seguro de que querés eliminar este contacto de la empresa?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-2 rounded-lg border border-slate-600 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonasEmpresaPage;
