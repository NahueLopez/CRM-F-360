import React, { useEffect, useState } from "react";
import type { Company } from "../../types/company";
import { companyService } from "../../services/companyService";
import CompanyForm from "../../components/companies/CompanyForm";
import CompaniesTable from "../../components/companies/CompaniesTable";

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editing, setEditing] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (err) {
      console.error("No se pudo cargar empresas (¿ya está el backend?)", err);
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
    const newCompany = await companyService.create(data);
    setCompanies((prev) => [...prev, newCompany]);
    setShowForm(false);
  };

  const handleUpdate = async (data: Partial<Company>) => {
    if (!editing) return;
    const updated = await companyService.update(editing.id, data);

    setCompanies((prev) =>
      prev.map((c) => (c.id === editing.id ? updated : c))
    );

    setEditing(null);
    setShowForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que querés borrar esta empresa?")) return;
    await companyService.remove(id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
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
      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Empresas</h3>
          <p className="text-sm text-slate-400">
            Gestioná tus clientes/empresas para asociarles proyectos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewClick}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition"
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

      {/* Tabla */}
      <CompaniesTable
        data={companies}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default CompaniesPage;
