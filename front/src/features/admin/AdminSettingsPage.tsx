import { useEffect, useState } from "react";
import { DEFAULT_PREFERENCES } from "../settings/preferencesService";
import type { UserPreferences } from "../settings/preferencesService";
import { applyPreferences, loadPreferences } from "../../shared/theme/themeEngine";
import { api } from "../../shared/api/apiClient";

const ACCENT_COLORS = [
  { value: "#818cf8", label: "Indigo" },
  { value: "#6366f1", label: "Iris" },
  { value: "#a78bfa", label: "Violeta" },
  { value: "#8b5cf6", label: "Púrpura" },
  { value: "#c084fc", label: "Lavanda" },
  { value: "#f472b6", label: "Rosa" },
  { value: "#ec4899", label: "Fucsia" },
  { value: "#fb7185", label: "Coral" },
  { value: "#f87171", label: "Rojo" },
  { value: "#e11d48", label: "Carmesí" },
  { value: "#fb923c", label: "Naranja" },
  { value: "#f59e0b", label: "Ámbar" },
  { value: "#fbbf24", label: "Dorado" },
  { value: "#facc15", label: "Amarillo" },
  { value: "#eab308", label: "Mostaza" },
  { value: "#34d399", label: "Esmeralda" },
  { value: "#4ade80", label: "Verde" },
  { value: "#10b981", label: "Jade" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#06b6d4", label: "Cian" },
  { value: "#38bdf8", label: "Celeste" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#0ea5e9", label: "Cielo" },
  { value: "#22d3ee", label: "Aqua" },
  { value: "#94a3b8", label: "Plata" },
];

const THEMES: { value: UserPreferences["theme"]; label: string; icon: string; colors: string[] }[] = [
  { value: "light", label: "Claro", icon: "☀️", colors: ["#f1f5f9", "#ffffff", "#e2e8f0"] },
  { value: "light-warm", label: "Cálido", icon: "🌅", colors: ["#fef7ed", "#fffbf5", "#f5deb3"] },
  { value: "light-cool", label: "Frío", icon: "❄️", colors: ["#eff6ff", "#f8fbff", "#bfdbfe"] },
  { value: "light-rose", label: "Rosado", icon: "🌸", colors: ["#fff1f2", "#fffbfa", "#fecdd3"] },
  { value: "light-mint", label: "Menta", icon: "🍃", colors: ["#f0fdf4", "#fafffb", "#bbf7d0"] },
  { value: "dark-blue", label: "Azul oscuro", icon: "🌌", colors: ["#020617", "#0f172a", "#1e293b"] },
  { value: "dark-gray", label: "Gris oscuro", icon: "🌑", colors: ["#18181b", "#1c1c20", "#27272a"] },
  { value: "dark-black", label: "Negro puro", icon: "⬛", colors: ["#09090b", "#0f0f11", "#1a1a1e"] },
  { value: "dark-purple", label: "Violeta", icon: "🔮", colors: ["#0f0728", "#1c133a", "#2e215e"] },
  { value: "dark-emerald", label: "Esmeralda", icon: "🌲", colors: ["#022c22", "#064e3b", "#065f46"] },
];

const FONT_SIZES: { value: UserPreferences["fontSize"]; label: string; px: string }[] = [
  { value: "small", label: "Pequeño", px: "14px" },
  { value: "normal", label: "Normal", px: "16px" },
  { value: "large", label: "Grande", px: "17px" },
  { value: "xlarge", label: "Extra grande", px: "18px" },
];

const AdminSettingsPage = () => {
  const [prefs, setPrefs] = useState<UserPreferences>(loadPreferences);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isLight = prefs.theme.startsWith("light");

  // Load from API on mount (if available)
  useEffect(() => {
    api.get<{ preferences: string | null }>("/auth/preferences")
      .then((res) => {
        if (res.preferences) {
          try {
            const parsed = { ...DEFAULT_PREFERENCES, ...JSON.parse(res.preferences) };
            setPrefs(parsed);
            applyPreferences(parsed);
          } catch { /* ignore parse errors */ }
        }
      })
      .catch(() => { /* API not available, use localStorage */ });
  }, []);

  const updatePref = <K extends keyof UserPreferences>(key: K, val: UserPreferences[K]) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    applyPreferences(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      applyPreferences(prefs);
      await api.put<void>("/auth/preferences", {
        preferences: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrefs(DEFAULT_PREFERENCES);
    applyPreferences(DEFAULT_PREFERENCES);
  };

  // Theme-aware class helpers
  const sectionCls = isLight
    ? "bg-white border border-slate-200 shadow-sm"
    : "bg-slate-800/25 border border-slate-700/30";
  const headingCls = isLight ? "text-slate-700" : "text-slate-200";
  const subCls = isLight ? "text-slate-400" : "text-slate-500";
  const btnBorder = isLight
    ? "border-slate-200 hover:border-slate-300"
    : "border-slate-700/30 hover:border-slate-600/50";
  const btnBorderActive = isLight ? "border-slate-800/60 shadow-md" : "border-white/50 shadow-lg";
  const labelCls = isLight ? "text-slate-600" : "text-slate-300";
  const dimCls = isLight ? "text-slate-400" : "text-slate-600";
  const previewBg = isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/40 border-slate-700/30";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>Preferencias</h2>
          <p className={`text-sm mt-1 ${subCls}`}>
            Personalizá la apariencia del panel de administración
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className={`px-3 py-2 rounded-xl text-xs transition ${isLight ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"}`}
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
            ) : saved ? (
              "✓ Guardado"
            ) : (
              "💾 Guardar"
            )}
          </button>
        </div>
      </div>

      {/* ── Theme ── */}
      <section className={`${sectionCls} rounded-2xl p-5`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🎨</span>
          <h3 className={`text-sm font-semibold ${headingCls}`}>Tema</h3>
        </div>
        <p className={`text-[11px] ${subCls} mb-4`}>
          Elegí entre modo claro y variantes oscuras. Se aplica a todo el sistema.
        </p>

        <div className="grid grid-cols-5 gap-3">
          {THEMES.map((t) => {
            const selected = prefs.theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => updatePref("theme", t.value)}
                className={`group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  selected ? btnBorderActive + " scale-[1.02]" : btnBorder
                }`}
              >
                <div className={`w-full h-10 rounded-lg overflow-hidden flex border ${isLight ? "border-slate-200" : "border-slate-700/30"}`}>
                  {t.colors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">{t.icon}</span>
                  <span className={`text-[10px] font-medium ${labelCls}`}>{t.label}</span>
                </div>
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

      {/* ── Accent Color ── */}
      <section className={`${sectionCls} rounded-2xl p-5`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">💎</span>
          <h3 className={`text-sm font-semibold ${headingCls}`}>Color de acento</h3>
        </div>
        <p className={`text-[11px] ${subCls} mb-4`}>
          Se aplica a botones, links y elementos interactivos en todo el sistema
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
                    className={`w-8 h-8 rounded-xl transition-all shadow-sm ${
                      selected
                        ? `ring-2 ring-offset-2 scale-110 ${isLight ? "ring-slate-400 ring-offset-white" : "ring-white/60 ring-offset-slate-900"}`
                        : "group-hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold drop-shadow-lg">✓</span>
                    </div>
                  )}
                </div>
                <span
                  className={`text-[8px] transition ${
                    selected ? labelCls : `${dimCls} group-hover:${labelCls}`
                  }`}
                >
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className={`mt-4 p-3 rounded-xl border ${previewBg}`}>
          <p className={`text-[9px] uppercase tracking-wider mb-2.5 ${subCls}`}>Vista previa</p>
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
          </div>
        </div>
      </section>

      {/* ── Font Size ── */}
      <section className={`${sectionCls} rounded-2xl p-5`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🔤</span>
          <h3 className={`text-sm font-semibold ${headingCls}`}>Tamaño de fuente</h3>
        </div>
        <p className={`text-[11px] ${subCls} mb-4`}>
          Ajustá el tamaño base del texto en toda la app
        </p>

        <div className="grid grid-cols-4 gap-3">
          {FONT_SIZES.map((f) => {
            const selected = prefs.fontSize === f.value;
            return (
              <button
                key={f.value}
                onClick={() => updatePref("fontSize", f.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selected ? btnBorderActive : btnBorder
                }`}
              >
                <span className={`font-bold ${headingCls}`} style={{ fontSize: f.px }}>
                  Aa
                </span>
                <span className={`text-[11px] font-medium ${labelCls}`}>{f.label}</span>
                <span className={`text-[9px] ${dimCls}`}>{f.px}</span>
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

      {/* ── Animation toggle ── */}
      <section className={`${sectionCls} rounded-2xl p-5`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">✨</span>
          <h3 className={`text-sm font-semibold ${headingCls}`}>Animaciones</h3>
        </div>
        <p className={`text-[11px] ${subCls} mb-4`}>
          Las animaciones hacen que la interfaz se sienta más viva y moderna
        </p>

        <div className={`flex items-center gap-4 p-4 rounded-xl border ${previewBg}`}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: prefs.accentColor + "20" }}
            >
              <div
                className="w-5 h-5 rounded-full animate-pulse"
                style={{ backgroundColor: prefs.accentColor }}
              />
            </div>
            <div>
              <p className={`text-sm font-medium ${headingCls}`}>Animaciones activas</p>
              <p className={`text-[11px] ${subCls}`}>Transiciones suaves, hover effects y micro-animaciones habilitadas</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSettingsPage;
