// CSV Export Service

export const exportService = {
    /** Downloads a CSV file from the given endpoint path. */
    downloadCsv: async (path: string, filename: string) => {
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
    },

    exportCompanies: () =>
        exportService.downloadCsv("/companies/export", `companies_${new Date().toISOString().slice(0, 10)}.csv`),
};
