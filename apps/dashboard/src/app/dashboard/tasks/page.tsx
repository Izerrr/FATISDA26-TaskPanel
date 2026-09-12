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

  const canTestNotify = roles.some((role) =>
    ["ADMIN", "OWNER", "KETUA_ANGKATAN", "PJ_KELAS", "PJ_MATKUL"].includes(role),
  );

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

                <h1 className="text-xl font-bold text-liquid-text">Tugas</h1>
              </div>

              <p className="mt-1 text-sm text-liquid-text-secondary">Kelola tugas personal dan tugas kelas dalam satu tempat.</p>

              {(prodiLabel || user?.kelas) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {prodiLabel && <span className="text-xs font-medium text-liquid-text-secondary">{prodiLabel}</span>}

                  {prodiLabel && user?.kelas && <span className="text-slate-300">·</span>}

                  {user?.kelas && <span className="text-xs font-medium text-liquid-text-secondary">Kelas {user.kelas}</span>}

                  {roles
                    .filter((role) => role !== "STUDENT")
                    .map((role) => {
                      const label = role === "ADMIN" ? "Administrator" : role === "PJ_KELAS" ? "PJ Kelas" : role === "PJ_MATKUL" ? "PJ Mata Kuliah" : null;

                      if (!label) {
                        return null;
                      }

                      return (
                        <span key={role} className="rounded-full bg-liquid-accent/10 px-2.5 py-1 text-[10px] font-semibold text-liquid-accent">
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
                  className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3.5 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100/80"
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
          <div className="rounded-2xl border border-liquid-border bg-white p-4 shadow-glass">
            <p className="text-xs font-medium text-liquid-text-secondary">Total Tugas</p>

            <p className="mt-2 text-2xl font-bold text-liquid-text">{tasks.length}</p>
          </div>

          <div className="rounded-2xl border border-liquid-border bg-white p-4 shadow-glass">
            <p className="text-xs font-medium text-liquid-text-secondary">Belum Selesai</p>

            <p className="mt-2 text-2xl font-bold text-liquid-text">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-liquid-border bg-white p-4 shadow-glass">
            <p className="text-xs font-medium text-liquid-text-secondary">Selesai</p>

            <p className="mt-2 text-2xl font-bold text-liquid-text">{doneCount}</p>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-liquid-border bg-white p-4 shadow-glass">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari tugas..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-liquid-accent focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="hidden h-4 w-4 text-slate-400 sm:block" />

              <select value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-liquid-accent">
                <option value="ALL">Semua Scope</option>
                <option value="PERSONAL">Personal</option>
                <option value="CLASS">Kelas</option>
              </select>
            </div>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-liquid-accent">
              <option value="ALL">Semua Status</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="NEED_REVIEW">Need Review</option>
              <option value="DONE">Done</option>
            </select>

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              disabled={coursesLoading}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-liquid-accent disabled:opacity-50"
            >
              <option value="ALL">Semua Mata Kuliah</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-3 text-xs text-liquid-text-secondary">
            Menampilkan <span className="font-semibold text-liquid-text">{filteredTasks.length}</span> dari <span className="font-semibold text-liquid-text">{tasks.length}</span> tugas.
          </p>
        </section>

        {/* Kanban */}
        {tasksError ? (
          <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-glass">
            <h2 className="font-bold text-liquid-text">Gagal memuat tugas</h2>

            <p className="mt-1 text-sm text-liquid-text-secondary">Terjadi masalah saat mengambil data tugas.</p>

            <button type="button" onClick={() => void mutate()} className="mt-4 rounded-xl bg-liquid-accent px-4 py-2.5 text-sm font-semibold text-white">
              Coba Lagi
            </button>
          </section>
        ) : (
          <section className="rounded-2xl border border-liquid-border bg-white p-4 shadow-glass md:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-liquid-text">Papan Tugas</h2>

                <p className="mt-1 text-xs text-liquid-text-secondary">Drag & drop tugas untuk memperbarui status pengerjaan.</p>
              </div>

              <span className="text-xs font-medium text-liquid-text-secondary">{filteredTasks.length} tugas</span>
            </div>

            <KanbanBoard tasks={filteredTasks} isLoading={tasksLoading} onMutated={() => void mutate()} />
          </section>
        )}
      </div>

      {/* Create Task */}
      {selectedGuild && user && (
        <NewTaskModal
          open={createOpen}
          guildId={selectedGuild}
          courses={courses}
          roles={roles}
          userId={user.id}
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Admin Testing Environment: Notifikasi Discord */}
      {canTestNotify && (
        <TaskNotificationTestModal
          open={testOpen}
          onClose={() => setTestOpen(false)}
          currentUser={user}
        />
      )}
    </DashboardFrame>
  );
}
