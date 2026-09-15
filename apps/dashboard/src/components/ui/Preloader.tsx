"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface PreloaderProps {
  visible: boolean;
  message?: string;
  subtext?: string;
}

export function Preloader({ visible, message = "Menyelaraskan Sesi...", subtext = "FATISDA 2026 TaskPanel" }: PreloaderProps) {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <aside
      aria-label="Status Pemuatan"
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300 pointer-events-none ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className={`relative flex flex-col items-center justify-center rounded-3xl border border-sky-500/20 bg-slate-900/90 dark:bg-slate-950/90 px-8 py-6 shadow-2xl shadow-sky-500/10 transition-all duration-300 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
        }`}
      >
        {/* Glowing Steam-style Orbital Ring Loader */}
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
          {/* Subtle Ambient Glow Behind Ring */}
          <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-lg animate-pulse" />

          {/* Outer Track Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-700/40 dark:border-slate-800" />

          {/* Spinning Gradient Arc */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 border-r-indigo-500 animate-spin" />

          {/* Inner Pulsing Core Icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
        </div>

        {/* Text Details */}
        <p className="text-xs font-bold tracking-wide text-slate-100 text-center">{message}</p>

        <p className="mt-1 text-[10px] font-medium tracking-wider text-sky-400/80 uppercase">{subtext}</p>
      </div>
    </aside>
  );
}
