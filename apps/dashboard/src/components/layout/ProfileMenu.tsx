"use client";

import { LogOut, UserRound, ChevronRight, Link2, ShieldCheck, MessageSquare, Sparkles } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRole } from "@/hooks/useRole";
import { FeedbackModal } from "@/components/dashboard/FeedbackModal";

export function ProfileMenu() {
  const { data: session } = useSession();
  const { user, roles } = useRole();

  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const displayName = user?.username || session?.user?.name || "Mahasiswa";
  const displayAvatar = user?.avatar || session?.user?.image || null;

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-xl p-0.5 transition hover:bg-black/[0.04] dark:hover:bg-slate-800 ring-2 ring-transparent hover:ring-liquid-accent/30"
          title="Menu Profil Saya"
          aria-label="Menu Profil Saya"
        >
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt={displayName}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-liquid-accent text-xs font-bold text-white shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* User Preview Header */}
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="block p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition group"
            >
              <div className="flex items-center gap-3">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="h-10 w-10 shrink-0 rounded-xl object-cover ring-2 ring-liquid-accent/20"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-liquid-accent text-sm font-bold text-white shadow-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-liquid-accent dark:group-hover:text-sky-400 transition-colors">
                    {displayName}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {user?.nim || user?.email || (user?.kelas ? `Kelas ${user.kelas}` : "Akun Terverifikasi")}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {roles && roles.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {roles.slice(0, 2).map((r) => (
                    <span
                      key={String(r)}
                      className="rounded-md bg-liquid-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300"
                    >
                      {r === "ADMIN" ? "Admin" : r === "PJ_KELAS" ? "PJ Kelas" : r === "PJ_MATKUL" ? "PJ Matkul" : "Mahasiswa"}
                    </span>
                  ))}
                </div>
              )}
            </Link>

            {/* Action Links */}
            <div className="p-1.5 space-y-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <UserRound className="h-3.5 w-3.5 text-liquid-accent dark:text-sky-400" />
                  <span>Lihat Profil Saya</span>
                </div>
                <span className="text-[10px] text-slate-400">Buka →</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setFeedbackOpen(true);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 transition group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span className="group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">Lapor Bug &amp; Masukan</span>
                </div>
                <span className="rounded bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">Beta</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  signOut({
                    callbackUrl: "/login",
                  })
                }
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
