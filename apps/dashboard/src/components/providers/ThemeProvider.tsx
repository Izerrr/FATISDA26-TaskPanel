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

  function applyTheme(newTheme: Theme) {
    if (typeof document !== "undefined") {
      // Temporarily disable CSS transitions on the DOM during theme toggle
      // This ensures 100% of elements (cards, sidebar, background, borders, text)
      // switch theme at the EXACT same millisecond without trailing/delayed transitions
      const css = document.createElement("style");
      css.appendChild(
        document.createTextNode(
          `*:not([data-theme-anim]):not([data-theme-anim] *) {
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -o-transition: none !important;
            -ms-transition: none !important;
            transition: none !important;
          }`,
        ),
      );
      document.head.appendChild(css);

      setThemeState(newTheme);
      localStorage.setItem("fatisda_theme", newTheme);
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

      // Force synchronous reflow so all elements adopt new colors instantly
      window.getComputedStyle(document.body);

      // Re-enable interactions on next frame
      setTimeout(() => {
        if (document.head.contains(css)) {
          document.head.removeChild(css);
        }
      }, 20);
    } else {
      setThemeState(newTheme);
      localStorage.setItem("fatisda_theme", newTheme);
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
