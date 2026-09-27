"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "dark" | "light" | "system";
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "dark" | "light";
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_EVENT = "kashflow-theme-change";

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}
function subscribeSystem(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function readTheme(fallback: Theme): Theme {
  const saved =
    localStorage.getItem("kashflow-theme") ||
    localStorage.getItem("mikra-theme");
  return saved === "dark" || saved === "light" || saved === "system"
    ? saved
    : fallback;
}
function setTheme(theme: Theme) {
  localStorage.setItem("kashflow-theme", theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}
export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => readTheme(defaultTheme),
    () => defaultTheme,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  const actualTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(actualTheme);
    document.documentElement.style.colorScheme = actualTheme;
  }, [actualTheme]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        actualTheme,
        toggleTheme: () => setTheme(actualTheme === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
