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
import { ClassSelectorModal } from "@/components/dashboard/ClassSelectorModal";
import { AccountLinkingModal } from "@/components/dashboard/AccountLinkingModal";
import { SlidersHorizontal, Link2, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import type { Course } from "@/types";

import { NewTaskModal } from "@/components/kanban/NewTaskModal";

export function DashboardShell() {
  const { selectedGuild } = useGuild();

  const { roles, user, isGoogle } = useRole();

  const { courses, isLoading: coursesLoading } = useCourses();

  const { tasks, isLoading: tasksLoading, isError: tasksError, mutate } = useTasks(selectedGuild);

  const { schedules, isLoading: schedulesLoading, isError: schedulesError } = useSchedule();

  const [search, setSearch] = useState("");

  const searchParams = useSearchParams();
  const linkedSuccess = searchParams.get("linked");

  const [createOpen, setCreateOpen] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [linkingModalOpen, setLinkingModalOpen] = useState(false);

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
            {user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : "Prodi belum ditentukan"}
          </span>

          {user?.kelas && (
            <>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-sm font-medium text-liquid-text-secondary dark:text-slate-400">Kelas {user.kelas}</span>
            </>
          )}

          <button
            type="button"
            onClick={() => setClassModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <SlidersHorizontal className="h-2.5 w-2.5" />
            <span>{user?.kelas ? "Ubah Kelas" : "Pilih Kelas"}</span>
          </button>

          {/* Tombol Tautkan Akun Discord / Google */}
          <button
            type="button"
            onClick={() => setLinkingModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Kelola sambungan akun Discord dan Google UNS"
          >
            <Link2 className="h-2.5 w-2.5 text-liquid-accent dark:text-sky-400" />
            <span>
              {user?.email && (user?.discordId || !user?.id.startsWith("google_"))
                ? "Akun Terhubung"
                : user?.email
                ? "Tautkan Discord"
                : "Tautkan Google UNS"}
            </span>
          </button>

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

        {linkedSuccess && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Akun berhasil ditautkan! Data tugas personal, jadwal, dan peran kamu sekarang otomatis tersinkronisasi.
              </span>
            </div>
          </div>
        )}

        {isGoogle && (!user?.prodi || !user?.kelas) && (
          <div className="mt-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/80 dark:bg-sky-950/40 p-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-sky-900 dark:text-sky-200">
                  Lengkapi Kelas &amp; Program Studi
                </p>
                <p className="text-[11px] text-sky-700 dark:text-sky-300 leading-relaxed">
                  Kamu masuk dengan Akun Google UNS. Pilih prodi dan kelas kamu agar jadwal kuliah dan daftar tugas kelas dapat ditampilkan dengan benar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClassModalOpen(true)}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 active:scale-95 shrink-0"
              >
                Pilih Kelas
              </button>
            </div>
          </div>
        )}
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

      <NewTaskModal open={createOpen} guildId={selectedGuild || ""} courses={courses} roles={roles.map((role) => String(role))} user={user} userId={user?.id} onClose={() => setCreateOpen(false)} onCreated={() => void mutate()} />

      <ClassSelectorModal
        open={classModalOpen}
        initialProdi={user?.prodi}
        initialKelas={user?.kelas}
        initialSemester={user?.semester}
        onClose={() => setClassModalOpen(false)}
        onSaved={() => {
          window.location.reload();
        }}
      />

      <AccountLinkingModal
        open={linkingModalOpen}
        user={user}
        onClose={() => setLinkingModalOpen(false)}
      />
    </DashboardFrame>
  );
}

export default DashboardShell;
