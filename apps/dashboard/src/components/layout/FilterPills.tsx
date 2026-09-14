"use client";

import { useState } from "react";

const FILTERS = ["SEMUA", "MILIKKU", "TERLAMBAT", "7 HARI"];

export function FilterPills() {
  const [active, setActive] = useState("SEMUA");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {FILTERS.map((f) => {
        const isActive = active === f;

        return (
          <button
            key={f}
            type="button"
            onClick={() => setActive(f)}
            className={`
              rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all
              ${
                isActive
                  ? "bg-liquid-accent text-white shadow-sm ring-2 ring-liquid-accent/30"
                  : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }
            `}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
