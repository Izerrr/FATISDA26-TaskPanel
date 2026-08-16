"use client";

import { useState } from "react";

const FILTERS = ["SEMUA", "MILIKKU", "TERLAMBAT", "7 HARI"];

export function FilterPills() {
  const [active, setActive] = useState("SEMUA");

  return (
    <div className="flex items-center gap-2">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className={`
            fsd-meta px-3 py-1.5 rounded-md text-[10px] transition-all border
            ${active === f
              ? "bg-fsd-accent text-fsd-bg border-fsd-accent"
              : "bg-fsd-card text-fsd-text-secondary border-fsd-border-light/30 hover:border-fsd-accent/40"}
          `}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
