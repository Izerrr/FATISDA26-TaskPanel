"use client";

import { useEffect, useState } from "react";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Megaphone, X, ArrowRight, Pin } from "lucide-react";
import type { User } from "next-auth";

interface AnnouncementToastProps {
  user: any;
}

export function AnnouncementToast({ user }: AnnouncementToastProps) {
  const { announcements } = useAnnouncements(user?.prodi, user?.kelas);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Take the most recent pinned or latest announcement
  const activeAnnouncement = announcements.find((a) => a.isPinned) || announcements[0];

  if (!activeAnnouncement || dismissedId === activeAnnouncement.id) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-300/80 dark:border-sky-800 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-white dark:from-slate-900 dark:via-sky-950/30 dark:to-slate-900 p-3.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
            <Megaphone className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeAnnouncement.isPinned && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </span>
              )}
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeAnnouncement.title}
              </span>
              <span className="text-[10px] text-slate-400">· {activeAnnouncement.author.username}</span>
            </div>

            <p className={`text-xs text-slate-600 dark:text-slate-300 mt-0.5 ${expanded ? "" : "truncate"}`}>
              {activeAnnouncement.content}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-100/60 dark:hover:bg-slate-800 transition"
          >
            {expanded ? "Ringkas" : "Baca"}
          </button>

          <button
            type="button"
            onClick={() => setDismissedId(activeAnnouncement.id)}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Tutup pemberitahuan ini"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
