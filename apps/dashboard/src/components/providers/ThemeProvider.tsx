"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Check stored preference
    const saved = localStorage.getItem("fatisda_theme") as Theme | null;
    if (saved === "dark" || saved === "light") {
      setThemeState(saved);
      if (saved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      // 2. Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
      } else {
        setThemeState("light");
        document.documentElement.classList.remove("dark");
      }
    }
    setMounted(true);
  }, []);

  function applyTheme(newTheme: Theme) {
    setThemeState(newTheme);
    localStorage.setItem("fatisda_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function setTheme(newTheme: Theme) {
    // Add page transition class
    document.documentElement.classList.add("theme-transition");
    applyTheme(newTheme);
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 450);
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    // If browser supports View Transitions API, use it for cross-fade/circular reveal
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      document.documentElement.classList.add("theme-transition");
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        applyTheme(nextTheme);
      });
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 450);
    } else {
      setTheme(nextTheme);
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
