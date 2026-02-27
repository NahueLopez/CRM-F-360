import { api } from "../../shared/api/apiClient";

export interface UserPreferences {
    accentColor: string;
    theme: "dark-blue" | "dark-gray" | "dark-black" | "light" | "light-warm" | "light-cool";
    fontSize: "small" | "normal" | "large" | "xlarge";
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    accentColor: "#818cf8",
    theme: "dark-blue",
    fontSize: "normal",
};

export const preferencesService = {
    get: async (): Promise<UserPreferences> => {
        const res = await api.get<{ preferences: string | null }>("/auth/preferences");
        if (!res.preferences) return DEFAULT_PREFERENCES;
        try {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(res.preferences) };
        } catch {
            return DEFAULT_PREFERENCES;
        }
    },

    update: async (prefs: UserPreferences): Promise<void> => {
        await api.put<void>("/auth/preferences", {
            preferences: JSON.stringify(prefs),
        });
    },
};
