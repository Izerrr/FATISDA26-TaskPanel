import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],

  theme: {
    extend: {
      colors: {
        liquid: {
          bg: "#F2F2F7",
          "bg-warm": "#FAFAF8",
          surface: "rgba(255,255,255,0.72)",
          "surface-solid": "#FFFFFF",
          border: "rgba(0,0,0,0.06)",
          "border-strong": "rgba(0,0,0,0.10)",
          accent: "#0077B6",
          "accent-soft": "#E6F4F1",
          teal: "#2D6A5B",
          "teal-soft": "#E8F5F0",
          text: "#1C1C1E",
          "text-secondary": "#8E8E93",
          "text-tertiary": "#C7C7CC",
          success: "#34C759",
          "success-soft": "#E5F9ED",
          warning: "#FF9500",
          "warning-soft": "#FFF4E5",
          danger: "#FF3B30",
          "danger-soft": "#FFE5E3",
          purple: "#AF52DE",
          "purple-soft": "#F5E8FC",
          pink: "#FF2D55",
          "pink-soft": "#FFE5EA",
        },
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["SF Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "glass-lg": "0 8px 32px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03)",
        float: "0 20px 60px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
