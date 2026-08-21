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

  const effectiveGuild = selectedGuild ?? guilds[0]?.id ?? null;

  useEffect(() => {
    if (!selectedGuild && guilds[0]?.id) {
      setSelectedGuild(guilds[0].id);
    }
  }, [guilds, selectedGuild, setSelectedGuild]);

  if (guildsLoading || coursesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg">
        <Loader2 className="h-6 w-6 animate-spin text-liquid-accent" />
      </div>
    );
  }

  if (guildsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-liquid-bg p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-glass">
          <h1 className="text-lg font-bold text-liquid-text">Gagal memuat workspace</h1>

          <p className="mt-2 text-sm leading-6 text-liquid-text-secondary">TaskPanel tidak dapat memverifikasi koneksi workspace FATISDA 2026.</p>

          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white">
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

          <p className="mt-2 text-sm leading-6 text-liquid-text-secondary">Akun Discord ini belum terhubung ke workspace FATISDA 2026 yang dapat dikelola TaskPanel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-liquid-bg">
      <Sidebar courses={courses} user={user} guildId={effectiveGuild} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onNewTask={onNewTask} search={search} onSearchChange={setSearch} />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-[1500px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardFrame;
