"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, LogOut, RefreshCw } from "lucide-react";
import { signOut } from "next-auth/react";

import { useGuild } from "@/components/providers/GuildProvider";
import { useGuilds } from "@/hooks/useGuilds";
import { useRole } from "@/hooks/useRole";
import { useCourses } from "@/hooks/useCourses";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

import type { Course } from "@/types";

interface DashboardFrameProps {
  children: React.ReactNode;
  onNewTask?: () => void;
}

export function DashboardFrame({ children, onNewTask }: DashboardFrameProps) {
  const { guilds, isLoading: guildsLoading, isError: guildsError } = useGuilds();

  const { selectedGuild, setSelectedGuild } = useGuild();

  const { user } = useRole();

  const { courses, isLoading: coursesLoading } = useCourses();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Jika user aktif tapi guilds list lambat/kosong, fallback ke server default FATISDA agar tidak memblokir akses
  const defaultFallbackGuild = "1547427568599302287";
  const effectiveGuild = selectedGuild ?? guilds[0]?.id ?? (user ? defaultFallbackGuild : null);

  useEffect(() => {
    if (guilds.length > 0) {
      const isValid = selectedGuild && guilds.some((g) => g.id === selectedGuild);
      if (!isValid) {
        setSelectedGuild(guilds[0].id);
      }
    }
  }, [guilds, selectedGuild, setSelectedGuild]);

  if (guildsLoading || coursesLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-liquid-bg dark:bg-slate-950">
        {/* Skeleton Sidebar (Desktop) */}
        <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-liquid-border bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:flex">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-16 animate-pulse rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </aside>

        {/* Skeleton Main Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-liquid-border bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-4 w-32 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          </header>
          <main className="min-h-0 flex-1 p-4 md:p-6">
            <div className="mx-auto max-w-[1500px] space-y-6">
              <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900" />
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900" />
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900" />
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900" />
              </div>
              <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm dark:bg-slate-900" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (guildsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg p-6 dark:bg-slate-950">
        <div className="max-w-md w-full rounded-3xl border border-red-200 bg-white p-6 sm:p-8 text-center shadow-glass dark:border-red-900/50 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-liquid-text dark:text-slate-100">Gagal memuat workspace</h1>
          <p className="mt-2 text-sm leading-6 text-liquid-text-secondary dark:text-slate-400">TaskPanel tidak dapat memverifikasi koneksi workspace FATISDA 2026.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  if (!effectiveGuild) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg p-6 dark:bg-slate-950">
        <div className="max-w-md w-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center shadow-glass dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-liquid-text dark:text-slate-100">Workspace Belum Terhubung</h1>
          <p className="mt-2 text-xs leading-relaxed text-liquid-text-secondary dark:text-slate-400">Akun Discord ini belum terdeteksi di dalam server FATISDA 2026 atau sesi token Discord perlu disegarkan kembali.</p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedGuild(defaultFallbackGuild);
                window.location.reload();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-sky-500"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Muat Ulang Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Ganti Akun Discord / Keluar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-liquid-bg dark:bg-slate-950">
      <Sidebar courses={courses} user={user} guildId={effectiveGuild} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onToggleMobileMenu={() => setMobileMenuOpen(true)} onNewTask={onNewTask} />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-[1500px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardFrame;
