import React, { useEffect, useState } from "react";
import type { Project } from "../../types/project";
import type { Company } from "../../types/company";
import { projectService } from "../../services/projectService";
import { companyService } from "../../services/companyService";
import ProjectForm from "../../components/projects/ProjectForm";
import ProjectsTable from "../../components/projects/ProjectsTable";

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [companiesData, projectsData] = await Promise.all([
        companyService.getAll(),
        projectService.getAll(),
      ]);
      setCompanies(companiesData);
      setProjects(projectsData);
    } catch (err) {
      console.error("Error cargando proyectos/empresas", err);
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
    const newProject = await projectService.create(data);
    setProjects((prev) => [...prev, newProject]);
    setShowForm(false);
  };

  const handleUpdate = async (data: Partial<Project>) => {
    if (!editing) return;
    const updated = await projectService.update(editing.id, data);
    setProjects((prev) =>
      prev.map((p) => (p.id === editing.id ? updated : p))
    );
    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que querés borrar este proyecto?")) return;
    await projectService.remove(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
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
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition"
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

      {/* Panel formulario */}
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

      {/* Tabla */}
      <ProjectsTable
        data={projects}
        companies={companies}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ProjectsPage;
