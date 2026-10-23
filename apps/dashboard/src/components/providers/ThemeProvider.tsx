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
    let initialTheme: Theme = "light";
    if (saved === "dark" || saved === "light") {
      initialTheme = saved;
    } else {
      // 2. Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      initialTheme = prefersDark ? "dark" : "light";
    }

    setThemeState(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", initialTheme === "dark" ? "#020617" : "#f2f2f7");
    }

    setMounted(true);
  }, []);

  function updateThemeDom(newTheme: Theme) {
    setThemeState(newTheme);
    try {
      localStorage.setItem("fatisda_theme", newTheme);
    } catch {}

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", newTheme === "dark" ? "#020617" : "#f2f2f7");
    }
  }

  function applyTheme(newTheme: Theme) {
    if (typeof document === "undefined") {
      setThemeState(newTheme);
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Gunakan modern View Transitions API jika didukung oleh browser
    if ("startViewTransition" in document && !prefersReducedMotion) {
      (document as any).startViewTransition(() => {
        updateThemeDom(newTheme);
      });
    } else {
      updateThemeDom(newTheme);
    }
  }

  function setTheme(newTheme: Theme) {
    applyTheme(newTheme);
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
