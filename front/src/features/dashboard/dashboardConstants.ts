/* ── Dashboard chart constants ── */

export const statusLabel: Record<string, { text: string; dot: string }> = {
    Planned: { text: "Planeado", dot: "bg-slate-400" },
    InProgress: { text: "En curso", dot: "bg-sky-400" },
    Paused: { text: "Pausado", dot: "bg-amber-400" },
    Done: { text: "Finalizado", dot: "bg-emerald-400" },
};

export const activityIcons: Record<string, string> = {
    Call: "📞", Meeting: "🤝", Email: "📧", Note: "📝", StatusChange: "🔄",
};

export const CHART_COLORS = ["#818cf8", "#22d3ee", "#fbbf24", "#34d399", "#f87171", "#a78bfa", "#fb7185"];

export const STATUS_COLORS: Record<string, string> = {
    Planned: "#94a3b8", InProgress: "#38bdf8", Paused: "#fbbf24", Done: "#34d399",
};

export const PRIORITY_COLORS: Record<string, string> = {
    Low: "#94a3b8", Medium: "#fbbf24", High: "#fb923c", Urgent: "#f87171",
};

export const CustomTooltipStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(100, 116, 139, 0.25)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#e2e8f0",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    padding: "8px 12px",
};
