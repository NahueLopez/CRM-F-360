// CSV Export Utilities — frontend-only CSV generation + backend download

/**
 * Generates a CSV string from an array of objects and triggers a download.
 * Works entirely in the browser — no backend endpoint needed.
 */
export function downloadCsvFromData<T extends object>(
    data: T[],
    columns: { key: keyof T; header: string }[],
    filename: string
) {
    if (data.length === 0) return;

    const escape = (val: unknown): string => {
        const str = val == null ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };

    const header = columns.map(c => escape(c.header)).join(",");
    const rows = data.map(row =>
        columns.map(c => escape(row[c.key])).join(",")
    );

    const csv = "\uFEFF" + [header, ...rows].join("\r\n"); // BOM for Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Backend-driven CSV download (for endpoints that return CSV directly). */
export async function downloadCsvFromApi(path: string, filename: string) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    const token = localStorage.getItem("token");
    const res = await fetch(`${baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Timestamp for filenames */
const ts = () => new Date().toISOString().slice(0, 10);

export const exportService = {
    downloadCsv: downloadCsvFromApi,

    exportCompanies: () =>
        downloadCsvFromApi("/companies/export", `empresas_${ts()}.csv`),

    exportContactsCsv: () =>
        downloadCsvFromApi("/contacts/export", `contactos_${ts()}.csv`),
};
