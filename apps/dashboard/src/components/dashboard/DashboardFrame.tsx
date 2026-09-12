"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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

  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveGuild = selectedGuild ?? guilds[0]?.id ?? null;

  useEffect(() => {
    if (!selectedGuild && guilds[0]?.id) {
      setSelectedGuild(guilds[0].id);
    }
  }, [guilds, selectedGuild, setSelectedGuild]);

  if (guildsLoading || coursesLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-liquid-bg">
        {/* Skeleton Sidebar (Desktop) */}
        <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-liquid-border bg-white p-6 md:flex">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded-md bg-slate-200" />
              <div className="h-3 w-16 animate-pulse rounded-md bg-slate-100" />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
        </aside>

        {/* Skeleton Main Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-liquid-border bg-white px-6">
            <div className="h-4 w-32 animate-pulse rounded-md bg-slate-200" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
          </header>
          <main className="min-h-0 flex-1 p-4 md:p-6">
            <div className="mx-auto max-w-[1500px] space-y-6">
              <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-200" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
                <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
              </div>
              <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (guildsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-glass">
          <h1 className="text-lg font-bold text-liquid-text">Gagal memuat workspace</h1>
          <p className="mt-2 text-sm leading-6 text-liquid-text-secondary">TaskPanel tidak dapat memverifikasi koneksi workspace FATISDA 2026.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

  if (!effectiveGuild) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg p-6">
        <div className="max-w-md rounded-2xl border border-liquid-border bg-white p-6 text-center shadow-glass">
          <h1 className="text-lg font-bold text-liquid-text">Workspace belum terhubung</h1>
          <p className="mt-2 text-sm leading-6 text-liquid-text-secondary">Akun Discord ini belum terhubung ke server FATISDA 2026 yang dapat dikelola TaskPanel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-liquid-bg">
      <Sidebar courses={courses} user={user} guildId={effectiveGuild} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onToggleMobileMenu={() => setMobileMenuOpen(true)} onNewTask={onNewTask} search={search} onSearchChange={setSearch} />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-[1500px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardFrame;
