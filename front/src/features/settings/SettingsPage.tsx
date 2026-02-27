import { useEffect, useState } from "react";
import { preferencesService, DEFAULT_PREFERENCES } from "./preferencesService";
import type { UserPreferences } from "./preferencesService";
import { applyPreferences } from "../../shared/theme/themeEngine";
import { useToast } from "../../shared/context/ToastContext";

const ACCENT_COLORS = [
    // Row 1 - Blues & Purples
    { value: "#818cf8", label: "Indigo" },
    { value: "#6366f1", label: "Iris" },
    { value: "#a78bfa", label: "Violeta" },
    { value: "#8b5cf6", label: "Púrpura" },
    { value: "#c084fc", label: "Lavanda" },
    // Row 2 - Pinks & Reds
    { value: "#f472b6", label: "Rosa" },
    { value: "#ec4899", label: "Fucsia" },
    { value: "#fb7185", label: "Coral" },
    { value: "#f87171", label: "Rojo" },
    { value: "#e11d48", label: "Carmesí" },
    // Row 3 - Oranges & Yellows
    { value: "#fb923c", label: "Naranja" },
    { value: "#f59e0b", label: "Ámbar" },
    { value: "#fbbf24", label: "Dorado" },
    { value: "#facc15", label: "Amarillo" },
    { value: "#eab308", label: "Mostaza" },
    // Row 4 - Greens & Teals
    { value: "#34d399", label: "Esmeralda" },
    { value: "#4ade80", label: "Verde" },
    { value: "#10b981", label: "Jade" },
    { value: "#14b8a6", label: "Teal" },
    { value: "#06b6d4", label: "Cian" },
    // Row 5 - Blues & special
    { value: "#38bdf8", label: "Celeste" },
    { value: "#3b82f6", label: "Azul" },
    { value: "#0ea5e9", label: "Cielo" },
    { value: "#22d3ee", label: "Aqua" },
    { value: "#94a3b8", label: "Plata" },
];

const THEMES: { value: UserPreferences["theme"]; label: string; icon: string; colors: string[] }[] = [
    {
        value: "light",
        label: "Claro",
        icon: "☀️",
        colors: ["#f1f5f9", "#ffffff", "#e2e8f0"],
    },
    {
        value: "light-warm",
        label: "Cálido",
        icon: "🌅",
        colors: ["#fef7ed", "#fffbf5", "#f5deb3"],
    },
    {
        value: "light-cool",
        label: "Frío",
        icon: "❄️",
        colors: ["#eff6ff", "#f8fbff", "#bfdbfe"],
    },
    {
        value: "dark-blue",
        label: "Azul oscuro",
        icon: "🌌",
        colors: ["#020617", "#0f172a", "#1e293b"],
    },
    {
        value: "dark-gray",
        label: "Gris oscuro",
        icon: "🌑",
        colors: ["#18181b", "#1c1c20", "#27272a"],
    },
    {
        value: "dark-black",
        label: "Negro puro",
        icon: "⬛",
        colors: ["#09090b", "#0f0f11", "#1a1a1e"],
    },
];

const FONT_SIZES: { value: UserPreferences["fontSize"]; label: string; px: string; sample: string }[] = [
    { value: "small", label: "Pequeño", px: "14px", sample: "Aa" },
    { value: "normal", label: "Normal", px: "16px", sample: "Aa" },
    { value: "large", label: "Grande", px: "17px", sample: "Aa" },
    { value: "xlarge", label: "Extra grande", px: "18px", sample: "Aa" },
];

const SettingsPage = () => {
    const { addToast } = useToast();
    const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        preferencesService.get().then((p) => {
            setPrefs(p);
            setLoading(false);
        });
    }, []);

    const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
        const updated = { ...prefs, [key]: val };
        setPrefs(updated);
        applyPreferences(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await preferencesService.update(prefs);
            applyPreferences(prefs);
            addToast("success", "Preferencias guardadas");
        } catch {
            addToast("error", "Error al guardar preferencias");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setPrefs(DEFAULT_PREFERENCES);
        applyPreferences(DEFAULT_PREFERENCES);
    };

    if (loading) return <SettingsSkeleton />;

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Preferencias</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Personalizá la apariencia del sistema a tu gusto
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition"
                    >
                        ↺ Restablecer
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-50 flex items-center gap-2"
                        style={{ backgroundColor: prefs.accentColor }}
                    >
                        {saving ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "💾 Guardar"
                        )}
                    </button>
                </div>
            </div>

            {/* ── Theme ── */}
            <section className="bg-slate-800/25 border border-slate-700/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🎨</span>
                    <h3 className="text-sm font-semibold text-slate-200">Tema</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                    Elegí entre modo claro y variantes oscuras
                </p>

                <div className="grid grid-cols-4 gap-3">
                    {THEMES.map((t) => {
                        const selected = prefs.theme === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => updatePref("theme", t.value)}
                                className={`group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selected
                                    ? "border-white/50 shadow-lg scale-[1.02]"
                                    : "border-slate-700/30 hover:border-slate-600/50"
                                    }`}
                            >
                                {/* Color preview */}
                                <div className="w-full h-14 rounded-lg overflow-hidden flex border border-slate-700/30">
                                    {t.colors.map((c, i) => (
                                        <div
                                            key={i}
                                            className="flex-1"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs">{t.icon}</span>
                                    <span className="text-[11px] text-slate-300 font-medium">
                                        {t.label}
                                    </span>
                                </div>
                                {selected && (
                                    <div
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white"
                                        style={{ backgroundColor: prefs.accentColor }}
                                    >
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── Accent Color ── */}
            <section className="bg-slate-800/25 border border-slate-700/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">💎</span>
                    <h3 className="text-sm font-semibold text-slate-200">Color de acento</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                    Se aplica a botones, links y elementos interactivos
                </p>

                <div className="grid grid-cols-10 gap-2">
                    {ACCENT_COLORS.map((c) => {
                        const selected = prefs.accentColor === c.value;
                        return (
                            <button
                                key={c.value}
                                onClick={() => updatePref("accentColor", c.value)}
                                className="group flex flex-col items-center gap-1"
                                title={c.label}
                            >
                                <div className="relative">
                                    <div
                                        className={`w-8 h-8 rounded-xl transition-all shadow-sm ${selected
                                            ? "ring-2 ring-white/60 ring-offset-2 ring-offset-slate-900 scale-110"
                                            : "group-hover:scale-110"
                                            }`}
                                        style={{ backgroundColor: c.value }}
                                    />
                                    {selected && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-white text-[10px] font-bold drop-shadow-lg">
                                                ✓
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <span
                                    className={`text-[8px] transition ${selected ? "text-slate-300" : "text-slate-600 group-hover:text-slate-400"
                                        }`}
                                >
                                    {c.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Preview */}
                <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-2.5">
                        Vista previa
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition shadow-sm"
                            style={{ backgroundColor: prefs.accentColor }}
                        >
                            Botón primario
                        </button>
                        <button
                            className="px-4 py-2 rounded-xl text-sm font-medium transition border"
                            style={{
                                color: prefs.accentColor,
                                borderColor: prefs.accentColor + "40",
                                backgroundColor: prefs.accentColor + "15",
                            }}
                        >
                            Botón secundario
                        </button>
                        <span className="text-sm font-medium" style={{ color: prefs.accentColor }}>
                            Link de ejemplo
                        </span>
                        <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                            style={{
                                backgroundColor: prefs.accentColor + "1a",
                                color: prefs.accentColor,
                                borderColor: prefs.accentColor + "40",
                            }}
                        >
                            Badge
                        </span>
                        <div
                            className="w-10 h-1.5 rounded-full"
                            style={{ backgroundColor: prefs.accentColor }}
                        />
                    </div>
                </div>
            </section>

            {/* ── Font Size ── */}
            <section className="bg-slate-800/25 border border-slate-700/30 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🔤</span>
                    <h3 className="text-sm font-semibold text-slate-200">Tamaño de fuente</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                    Ajustá el tamaño base del texto en toda la app
                </p>

                <div className="grid grid-cols-4 gap-3">
                    {FONT_SIZES.map((f) => {
                        const selected = prefs.fontSize === f.value;
                        return (
                            <button
                                key={f.value}
                                onClick={() => updatePref("fontSize", f.value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${selected
                                    ? "border-white/50 shadow-lg"
                                    : "border-slate-700/30 hover:border-slate-600/50"
                                    }`}
                            >
                                <span
                                    className="font-bold text-slate-200"
                                    style={{ fontSize: f.px }}
                                >
                                    {f.sample}
                                </span>
                                <span className="text-[11px] text-slate-300 font-medium">
                                    {f.label}
                                </span>
                                <span className="text-[9px] text-slate-600">{f.px}</span>
                                {selected && (
                                    <div
                                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white"
                                        style={{ backgroundColor: prefs.accentColor }}
                                    >
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

const SettingsSkeleton = () => (
    <div className="space-y-6 max-w-3xl animate-pulse">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <div className="skeleton h-7 w-40 rounded-lg" />
                <div className="skeleton h-4 w-64 rounded-lg" />
            </div>
            <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
        {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-700/30 bg-slate-800/30 p-5 space-y-3">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-3 w-56 rounded" />
                <div className="skeleton h-20 w-full rounded-xl" />
            </div>
        ))}
    </div>
);

export default SettingsPage;
