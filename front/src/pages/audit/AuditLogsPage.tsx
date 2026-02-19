import React, { useCallback, useEffect, useState } from "react";
import { auditLogService } from "../../services/auditLogService";
import type { AuditLogEntry } from "../../types/auditLog";

const ACTION_COLORS: Record<string, string> = {
    Create: "text-emerald-400 bg-emerald-500/10",
    Update: "text-sky-400 bg-sky-500/10",
    Delete: "text-red-400 bg-red-500/10",
    Login: "text-violet-400 bg-violet-500/10",
    Logout: "text-slate-400 bg-slate-500/10",
};

const ENTITY_ICONS: Record<string, string> = {
    Company: "🏢", Contact: "👤", Project: "📁", Task: "✅",
    Deal: "💰", User: "👥", TimeEntry: "⏱", Reminder: "⏰",
};

const AuditLogsPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await auditLogService.getAll(page, 50);
            setLogs(data);
        } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Registro de todas las acciones del sistema</p>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs disabled:opacity-30">← Anterior</button>
                    <span className="text-xs text-slate-500 self-center">Página {page}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs disabled:opacity-30">Siguiente →</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Cargando...</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p className="text-4xl mb-2">📋</p>
                    <p className="text-sm">No hay registros de auditoría</p>
                </div>
            ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700 text-left">
                                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Fecha</th>
                                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Usuario</th>
                                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Acción</th>
                                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Entidad</th>
                                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Nombre</th>
                                <th className="px-4 py-3 text-xs text-slate-400 font-medium">Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString("es-AR", {
                                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs">{log.userName}</td>
                                    <td className="px-4 py-2.5">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? "text-slate-400 bg-slate-500/10"}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs">
                                        <span className="mr-1">{ENTITY_ICONS[log.entityType] ?? "📄"}</span>
                                        {log.entityType}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-300">{log.entityName ?? "—"}</td>
                                    <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs truncate">{log.details ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
