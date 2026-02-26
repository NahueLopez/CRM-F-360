import React from "react";
import type { Company } from "../../companies/types";

interface DealFormData {
    title: string;
    companyId: string;
    value: string;
    notes: string;
    expectedCloseDate: string;
}

interface Props {
    form: DealFormData;
    companies: Company[];
    onChange: (form: DealFormData) => void;
    onSubmit: () => void;
    onClose: () => void;
}

const DealFormModal: React.FC<Props> = ({ form, companies, onChange, onSubmit, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Nueva oportunidad</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
                </div>
                <input value={form.title} onChange={e => onChange({ ...form, title: e.target.value })}
                    placeholder="Nombre de la oportunidad"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm placeholder:text-slate-500" />
                <div className="grid grid-cols-2 gap-3">
                    <select value={form.companyId} onChange={e => onChange({ ...form, companyId: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm">
                        <option value="">Empresa (opc.)</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="number" value={form.value} onChange={e => onChange({ ...form, value: e.target.value })}
                        placeholder="Valor $" className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                </div>
                <input type="date" value={form.expectedCloseDate} onChange={e => onChange({ ...form, expectedCloseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                <textarea value={form.notes} onChange={e => onChange({ ...form, notes: e.target.value })}
                    placeholder="Notas..." rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm resize-none placeholder:text-slate-500" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-600 text-sm">Cancelar</button>
                    <button onClick={onSubmit} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition">Crear</button>
                </div>
            </div>
        </div>
    );
};

export default DealFormModal;
