"use client";

import React, { useState, useRef, useEffect } from "react";
import { Building2, ExternalLink, Info, MapPin } from "lucide-react";
import { resolveCampusBuilding } from "@/lib/campus-buildings";

interface RoomLocationBadgeProps {
  room: string | null | undefined;
  variant?: "amber" | "indigo" | "slate";
  compact?: boolean;
}

export function RoomLocationBadge({
  room,
  variant = "slate",
  compact = false,
}: RoomLocationBadgeProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    if (containerRef.current && typeof window !== "undefined") {
      const rect = containerRef.current.getBoundingClientRect();
      // If the badge is past 45% of the screen width, anchor the popover to the right edge so it doesn't overflow right
      setAlignRight(rect.left > window.innerWidth * 0.45);
    }

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const displayRoom = room?.trim() || "TBA";
  const building = resolveCampusBuilding(displayRoom);

  const colorClasses =
    variant === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/50"
      : variant === "indigo"
        ? "bg-indigo-50 text-indigo-700 border-indigo-200/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800/50"
        : "bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/70 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700";

  return (
    <div ref={containerRef} className="relative inline-flex max-w-full min-w-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={`Info lokasi ruang ${displayRoom}`}
        className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg border transition ${
          compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        } font-medium ${colorClasses}`}
      >
        <MapPin className="h-3 w-3 shrink-0 opacity-75" />
        <span className="truncate">{displayRoom}</span>
        {building && <Info className="h-2.5 w-2.5 shrink-0 opacity-50" />}
      </button>

      {open && building && (
        <div
          className={`absolute bottom-full z-40 mb-2 w-60 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-72 ${
            alignRight ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1.5 flex items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{building.name}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {building.facultyOrUnit}
                {building.floorHint ? ` • ${building.floorHint}` : ""}
              </p>
            </div>
          </div>
          <p className="mb-2.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            {building.description}
          </p>
          <a
            href={building.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 shadow-xs"
          >
            <ExternalLink className="h-3 w-3" />
            Buka Titik Gedung di Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
