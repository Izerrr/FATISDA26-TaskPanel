"use client";

import { useMemo, useState } from "react";

import { useGuild } from "@/components/providers/GuildProvider";
import { useRole } from "@/hooks/useRole";
import { useTasks } from "@/hooks/useTasks";
import { useCourses } from "@/hooks/useCourses";
import { useSchedule } from "@/hooks/useSchedule";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { Overview } from "@/components/dashboard/Overview";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

import type { Course } from "@/types";

import { NewTaskModal } from "@/components/kanban/NewTaskModal";

export function DashboardShell() {
  const { selectedGuild } = useGuild();

  const { roles, user } = useRole();

  const { courses, isLoading: coursesLoading } = useCourses();

  const { tasks, isLoading: tasksLoading, isError: tasksError, mutate } = useTasks(selectedGuild);

  const { schedules, isLoading: schedulesLoading, isError: schedulesError } = useSchedule();

  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => [task.title, task.description ?? "", task.course?.name ?? ""].join(" ").toLowerCase().includes(query));
  }, [tasks, search]);

  return (
    <DashboardFrame onNewTask={() => setCreateOpen(true)}>
      <section>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-liquid-text dark:text-slate-100">Halo, {user?.username ?? "Mahasiswa"}!</h1>
          <p className="text-xs font-medium text-liquid-text-tertiary dark:text-slate-400">Semester Aktif: {user?.semester ?? 1}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-liquid-text-secondary dark:text-slate-400">
            {user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Prodi belum tersinkron"}
          </span>

          {user?.kelas && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-sm font-medium text-liquid-text-secondary dark:text-slate-400">Kelas {user.kelas}</span>
            </>
          )}

          {roles.map((role) => {
            const roleText = role === "ADMIN" ? "Administrator" : role === "PJ_KELAS" ? "PJ Kelas" : role === "PJ_MATKUL" ? "PJ Mata Kuliah" : null;

            if (!roleText) {
              return null;
            }

            return (
              <span key={String(role)} className="rounded-full bg-liquid-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-liquid-accent dark:bg-sky-500/20 dark:text-sky-300">
                {roleText}
              </span>
            );
          })}
        </div>
      </section>

      {tasksLoading || coursesLoading || schedulesLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm" />
          </div>
        </div>
      ) : tasksError ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-glass">
          <h2 className="font-bold text-liquid-text dark:text-slate-100">Gagal memuat tugas</h2>

          <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">Periksa koneksi dan endpoint task.</p>
        </div>
      ) : schedulesError ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 p-6 shadow-glass">
          <h2 className="font-bold text-liquid-text dark:text-slate-100">Jadwal belum tersedia</h2>

          <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">Data tugas tetap tersedia, tetapi jadwal belum dapat dimuat.</p>

          <Overview tasks={tasks} schedules={[]} />
        </div>
      ) : (
        <>
          <Overview tasks={tasks} schedules={schedules} />

          <section id="tasks" className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-4 shadow-glass md:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-bold text-liquid-text dark:text-slate-100">Papan Tugas</h2>

                <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">Seret tugas untuk memperbarui status pengerjaan.</p>
              </div>

              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{visibleTasks.length} tugas</span>
            </div>

            <KanbanBoard tasks={visibleTasks} onMutated={() => void mutate()} />
          </section>
        </>
      )}

      <NewTaskModal
        open={createOpen}
        guildId={selectedGuild || ""}
        courses={courses}
        roles={roles.map((role) => String(role))}
        user={user}
        userId={user?.id}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void mutate()}
      />
    </DashboardFrame>
  );
}

export default DashboardShell;
