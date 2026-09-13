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
          <h1 className="text-2xl font-bold tracking-tight text-liquid-text">Halo, {user?.username ?? "Mahasiswa"}!</h1>
          <p className="text-xs font-medium text-liquid-text-tertiary">Semester Aktif: {user?.semester ?? 2}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-liquid-text-secondary">
            {user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Prodi belum tersinkron"}
          </span>

          {user?.kelas && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-sm font-medium text-liquid-text-secondary">Kelas {user.kelas}</span>
            </>
          )}

          {roles.map((role) => {
            const roleText = role === "ADMIN" ? "Administrator" : role === "PJ_KELAS" ? "PJ Kelas" : role === "PJ_MATKUL" ? "PJ Mata Kuliah" : null;

            if (!roleText) {
              return null;
            }

            return (
              <span key={String(role)} className="rounded-full bg-liquid-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-liquid-accent">
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
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" />
          </div>
        </div>
      ) : tasksError ? (
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-glass">
          <h2 className="font-bold text-liquid-text">Gagal memuat tugas</h2>

          <p className="mt-1 text-sm text-liquid-text-secondary">Periksa koneksi dan endpoint task.</p>
        </div>
      ) : schedulesError ? (
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-glass">
          <h2 className="font-bold text-liquid-text">Jadwal belum tersedia</h2>

          <p className="mt-1 text-sm text-liquid-text-secondary">Data tugas tetap tersedia, tetapi jadwal belum dapat dimuat.</p>

          <Overview tasks={tasks} schedules={[]} />
        </div>
      ) : (
        <>
          <Overview tasks={tasks} schedules={schedules} />

          <section id="tasks" className="rounded-2xl border border-liquid-border bg-white/70 p-4 shadow-glass md:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-bold text-liquid-text">Papan Tugas</h2>

                <p className="mt-1 text-xs text-liquid-text-secondary">Seret tugas untuk memperbarui status pengerjaan.</p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{visibleTasks.length} tugas</span>
            </div>

            <KanbanBoard tasks={visibleTasks} onMutated={() => void mutate()} />
          </section>
        </>
      )}

      {selectedGuild && <NewTaskModal open={createOpen} guildId={selectedGuild} courses={courses} roles={roles.map((role) => String(role))} onClose={() => setCreateOpen(false)} onCreated={() => void mutate()} />}
    </DashboardFrame>
  );
}

export default DashboardShell;
