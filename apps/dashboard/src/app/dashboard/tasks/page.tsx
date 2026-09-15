"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Filter, FlaskConical, Plus, Search } from "lucide-react";

import { DashboardFrame } from "@/components/dashboard/DashboardFrame";
import { TaskNotificationTestModal } from "@/components/dashboard/TaskNotificationTestModal";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { NewTaskModal } from "@/components/kanban/NewTaskModal";

import { useGuild } from "@/components/providers/GuildProvider";
import { useCourses } from "@/hooks/useCourses";
import { useRole } from "@/hooks/useRole";
import { useTasks } from "@/hooks/useTasks";

import type { Task, TaskScope, TaskStatus } from "@/types";

type ScopeFilter = "ALL" | TaskScope;
type StatusFilter = "ALL" | TaskStatus;

export default function TasksPage() {
  const { selectedGuild } = useGuild();

  const { user, roles } = useRole();

  const { courses, isLoading: coursesLoading } = useCourses();

  const { tasks, isLoading: tasksLoading, isError: tasksError, mutate } = useTasks(selectedGuild);

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);

  const canTestNotify = roles.some((role) => ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(role));

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task: Task) => {
      const matchesSearch = !query || [task.title, task.description ?? "", task.course?.name ?? "", task.course?.code ?? ""].join(" ").toLowerCase().includes(query);

      const matchesScope = scopeFilter === "ALL" || task.scope === scopeFilter;

      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;

      const matchesCourse = courseFilter === "ALL" || task.course?.id === courseFilter;

      return matchesSearch && matchesScope && matchesStatus && matchesCourse;
    });
  }, [tasks, search, scopeFilter, statusFilter, courseFilter]);

  const activeCount = tasks.filter((task) => task.status !== "DONE").length;

  const doneCount = tasks.filter((task) => task.status === "DONE").length;

  const prodiLabel = user?.prodi === "INFORMATIKA" ? "Informatika" : user?.prodi === "SAINS_DATA" ? "Sains Data" : user?.prodi === "INFORMATIKA_PSDKU_KEBUMEN" ? "Informatika PSDKU Kebumen" : null;

  async function handleCreated() {
    await mutate();
  }

  return (
    <DashboardFrame onNewTask={() => setCreateOpen(true)}>
      <div className="space-y-6">
        {/* Header */}
        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-liquid-accent" />

                <h1 className="text-xl font-bold text-liquid-text dark:text-slate-100">Tugas</h1>
              </div>

              <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">Kelola tugas personal dan tugas kelas dalam satu tempat.</p>

              {(prodiLabel || user?.kelas) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {prodiLabel && <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">{prodiLabel}</span>}

                  {prodiLabel && user?.kelas && <span className="text-slate-300 dark:text-slate-600">·</span>}

                  {user?.kelas && <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">Kelas {user.kelas}</span>}

                  {roles
                    .filter((role) => role !== "STUDENT")
                    .map((role) => {
                      const label = role === "ADMIN" ? "Administrator" : role === "PJ_KELAS" ? "PJ Kelas" : role === "PJ_MATKUL" ? "PJ Mata Kuliah" : null;

                      if (!label) {
                        return null;
                      }

                      return (
                        <span key={role} className="rounded-full bg-liquid-accent/10 dark:bg-sky-500/20 px-3 py-1 text-xs font-semibold text-liquid-accent dark:text-sky-300">
                          {label}
                        </span>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {canTestNotify && (
                <button
                  type="button"
                  onClick={() => setTestOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/80 dark:bg-violet-950/40 px-3.5 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 shadow-sm transition hover:bg-violet-100/80 dark:hover:bg-violet-950/60"
                  title="Admin Testing Environment: Uji Notifikasi Discord"
                >
                  <FlaskConical className="h-4 w-4" />
                  <span className="hidden sm:inline">Uji Notifikasi</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                disabled={!selectedGuild}
                className="flex items-center justify-center gap-2 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-liquid-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Tugas Baru
              </button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-glass">
            <p className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">Total Tugas</p>

            <p className="mt-2 text-2xl font-bold text-liquid-text dark:text-slate-100">{tasks.length}</p>
          </div>

          <div className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-glass">
            <p className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">Belum Selesai</p>

            <p className="mt-2 text-2xl font-bold text-liquid-text dark:text-slate-100">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-glass">
            <p className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">Selesai</p>

            <p className="mt-2 text-2xl font-bold text-liquid-text dark:text-slate-100">{doneCount}</p>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-glass">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari tugas..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-liquid-accent focus:bg-white dark:focus:bg-slate-800/90 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="hidden h-4 w-4 text-slate-400 sm:block" />

              <select
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-liquid-accent"
              >
                <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Semua Scope
                </option>
                <option value="PERSONAL" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Personal
                </option>
                <option value="CLASS" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  Kelas
                </option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-liquid-accent"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Semua Status
              </option>
              <option value="TODO" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Todo
              </option>
              <option value="IN_PROGRESS" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                In Progress
              </option>
              <option value="NEED_REVIEW" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Need Review
              </option>
              <option value="DONE" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Done
              </option>
            </select>

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              disabled={coursesLoading}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-liquid-accent disabled:opacity-50"
            >
              <option value="ALL" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                Semua Mata Kuliah
              </option>

              {courses.map((course) => (
                <option key={course.id} value={course.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-3 text-xs text-liquid-text-secondary dark:text-slate-400">
            Menampilkan <span className="font-semibold text-liquid-text dark:text-slate-200">{filteredTasks.length}</span> dari <span className="font-semibold text-liquid-text dark:text-slate-200">{tasks.length}</span> tugas.
          </p>
        </section>

        {/* Kanban */}
        {tasksError ? (
          <section className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-glass">
            <h2 className="font-bold text-liquid-text dark:text-slate-100">Gagal memuat tugas</h2>

            <p className="mt-1 text-sm text-liquid-text-secondary dark:text-slate-400">Terjadi masalah saat mengambil data tugas.</p>

            <button type="button" onClick={() => void mutate()} className="mt-4 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white">
              Coba Lagi
            </button>
          </section>
        ) : (
          <section className="rounded-2xl border border-liquid-border dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 shadow-glass md:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-liquid-text dark:text-slate-100">Papan Tugas</h2>

                <p className="mt-1 text-xs text-liquid-text-secondary dark:text-slate-400">Drag & drop tugas untuk memperbarui status pengerjaan.</p>
              </div>

              <span className="text-xs font-medium text-liquid-text-secondary dark:text-slate-400">{filteredTasks.length} tugas</span>
            </div>

            <KanbanBoard tasks={filteredTasks} isLoading={tasksLoading} onMutated={() => void mutate()} />
          </section>
        )}
      </div>

      {/* Create Task */}
      <NewTaskModal open={createOpen} guildId={selectedGuild || ""} courses={courses} roles={roles} user={user} userId={user?.id} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />

      {/* Admin Testing Environment: Notifikasi Discord */}
      {canTestNotify && <TaskNotificationTestModal open={testOpen} onClose={() => setTestOpen(false)} currentUser={user} />}
    </DashboardFrame>
  );
}
