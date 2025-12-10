import React, { useEffect, useState } from "react";
import { Project } from "../../types/project";
import { Company } from "../../types/company";
import { projectService } from "../../services/projectService";
import { companyService } from "../../services/companyService";
import ProjectForm from "../../components/projects/ProjectForm";
import ProjectsTable from "../../components/projects/ProjectsTable";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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
      // cargo empresas y proyectos por separado para que si falla uno
      // el otro igual quede
      try {
        const companiesData = await companyService.getAll();
        setCompanies(companiesData);
      } catch (err) {
        console.error("Error cargando empresas", err);
        showError("No se pudieron cargar las empresas.");
      }

      try {
        const projectsData = await projectService.getAll();
        setProjects(projectsData);
      } catch (err) {
        console.error("Error cargando proyectos", err);
        showError("No se pudieron cargar los proyectos.");
      }
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

  const handleCreate = async (data: Partial<Project>) => {
    try {
      const newProject = await projectService.create(data);
      setProjects((prev) => [...prev, newProject]);
      setShowForm(false);
      showSuccess("Proyecto creado correctamente.");
    } catch (err) {
      console.error("Error al crear proyecto", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el proyecto."
      );
    }
  };

  const handleUpdate = async (data: Partial<Project>) => {
    if (!editing) return;

    try {
      const updated = await projectService.update(editing.id, data);
      setProjects((prev) =>
        prev.map((p) => (p.id === editing.id ? updated : p))
      );
      setEditing(null);
      setShowForm(false);
      showSuccess("Proyecto actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar proyecto", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar el proyecto."
      );
    }
  };

  // abre modal
  const handleAskDelete = (id: number) => {
    const project = projects.find((p) => p.id === id) || null;
    setProjectToDelete(project);
  };

  // confirma eliminación
  const handleDeleteConfirmed = async () => {
    if (!projectToDelete) return;

    const id = projectToDelete.id;
    setProjectToDelete(null);

    try {
      await projectService.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showSuccess("Proyecto eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar proyecto", err);
      showError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar el proyecto."
      );
    }
  };

  const handleEditClick = (project: Project) => {
    setEditing(project);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Feedback arriba de todo */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Proyectos</h3>
          <p className="text-sm text-slate-400">
            Gestioná los proyectos y asociálos a cada empresa.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewClick}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-indigo-600 text-sm font-medium"
          disabled={companies.length === 0}
        >
          + Nuevo proyecto
        </button>
      </div>

      {companies.length === 0 && (
        <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-700 rounded-lg px-3 py-2">
          Para crear proyectos primero necesitás cargar al menos una empresa.
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
          <h4 className="text-lg font-semibold mb-3">
            {editing ? "Editar proyecto" : "Crear nuevo proyecto"}
          </h4>

          <ProjectForm
            initial={editing ?? {}}
            companies={companies}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {loading && (
        <div className="text-sm text-slate-400">Cargando proyectos...</div>
      )}

      <ProjectsTable
        data={projects}
        companies={companies}
        onEdit={handleEditClick}
        onDelete={handleAskDelete}
      />

      {/* Modal de confirmación de borrado */}
      {projectToDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 w-full max-w-sm shadow-xl">
            <h4 className="text-base font-semibold mb-2">
              Eliminar proyecto
            </h4>
            <p className="text-sm text-slate-300 mb-4">
              ¿Seguro que querés eliminar el proyecto{" "}
              <span className="font-semibold">
                {projectToDelete.name}
              </span>{" "}
              ? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3 py-2 rounded-lg border border-slate-600 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-medium"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
