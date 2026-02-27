import type { UserPreferences } from "../../features/settings/preferencesService";
import { DEFAULT_PREFERENCES } from "../../features/settings/preferencesService";

const PREFS_KEY = "user_preferences";

const FONT_SIZE_MAP: Record<string, string> = {
    small: "14px",
    normal: "16px",
    large: "17px",
    xlarge: "18px",
};

/**
 * Apply user preferences as CSS custom properties on <html>.
 * Call on login and whenever preferences change.
 */
export function applyPreferences(prefs?: UserPreferences | null) {
    const p = prefs ?? loadPreferences();
    const root = document.documentElement;
    const body = document.body;

    // ── Accent color ──
    root.style.setProperty("--accent", p.accentColor);
    root.style.setProperty("--accent-light", p.accentColor + "26");

    // ── Theme ──
    const isLight = p.theme.startsWith("light");
    if (isLight) {
        body.classList.remove("dark");
        body.classList.add("light");
        root.removeAttribute("data-theme");
        // Set light variant for CSS targeting
        root.setAttribute("data-light", p.theme);
    } else {
        body.classList.remove("light");
        body.classList.add("dark");
        root.setAttribute("data-theme", p.theme);
        root.removeAttribute("data-light");
    }

    // ── Font size ──
    root.style.fontSize = FONT_SIZE_MAP[p.fontSize] || "16px";

    // Store locally for instant load
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

export function loadPreferences(): UserPreferences {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return DEFAULT_PREFERENCES;
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_PREFERENCES;
    }
}
