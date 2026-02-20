import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark", toggle: () => { } });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem("crm-theme");
        return (saved === "light" || saved === "dark") ? saved : "dark";
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
        localStorage.setItem("crm-theme", theme);
    }, [theme]);

    const toggle = () => setTheme(prev => prev === "dark" ? "light" : "dark");

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};
