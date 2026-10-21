"use client";

import { useEffect, useState } from "react";

import { useGuild } from "@/components/providers/GuildProvider";
import { useGuilds } from "@/hooks/useGuilds";
import { useRole } from "@/hooks/useRole";
import { useCourses } from "@/hooks/useCourses";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

interface DashboardFrameProps {
  children: React.ReactNode;
  onNewTask?: () => void;
}

export function DashboardFrame({ children, onNewTask }: DashboardFrameProps) {
  const { guilds, isLoading: guildsLoading } = useGuilds();
  const { selectedGuild, setSelectedGuild } = useGuild();
  const { user } = useRole();
  const { courses, isLoading: coursesLoading } = useCourses();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const defaultFallbackGuild = "1547427568599302287";
  const effectiveGuild = selectedGuild ?? guilds[0]?.id ?? defaultFallbackGuild;

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
      <div className="flex h-screen w-full max-w-full overflow-hidden bg-liquid-bg dark:bg-slate-950">
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
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-liquid-border bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
            <div className="h-4 w-32 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          </header>
          <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3.5 sm:p-5 md:p-6">
            <div className="mx-auto w-full max-w-[1500px] min-w-0 space-y-6">
              <div className="h-8 w-48 max-w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
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

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-liquid-bg dark:bg-slate-950">
      <Sidebar
        courses={courses}
        user={user}
        guildId={effectiveGuild}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNav onToggleMobileMenu={() => setMobileMenuOpen(true)} onNewTask={onNewTask} />

        <main className="min-h-0 w-full max-w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3.5 sm:p-5 md:p-6">
          <div className="mx-auto w-full max-w-[1500px] min-w-0 space-y-5 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardFrame;
